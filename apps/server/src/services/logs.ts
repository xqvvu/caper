import type { BaseLog, LogLevel, LogQuery, LogStats, LogStorage, LogType } from "@jigu/shared";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import { LOG_LEVELS, LOG_TYPES, uuidv7 } from "@jigu/shared";
import consola from "consola";
import { getCollection } from "@/db/mongo";
import { gracefulShutdown } from "@/shared/shutdown";

/**
 * 日志服务配置
 */
interface LogServiceConfig {
  /** 默认存储策略 */
  defaultStorage: LogStorage;
  /** 文件日志目录 */
  logDir: string;
  /** 是否启用异步写入 */
  async: boolean;
  /** 数据库日志保留天数 */
  dbRetentionDays: number;
  /** 文件日志保留天数 */
  fileRetentionDays: number;
  /** 批量写入大小 */
  batchSize: number;
  /** 批量写入间隔（毫秒） */
  batchInterval: number;
}

/**
 * 日志存储策略配置
 */
const STORAGE_RULES: Record<LogLevel | LogType, LogStorage> = {
  // 按级别配置
  debug: "console_only",
  info: "console_only",
  warn: "console_db",
  error: "all",
  fatal: "all",

  // 按类型配置
  http: "console_only",
  app: "console_db",
  db: "console_db",
  auth: "all",
  security: "all",
  performance: "console_db",
  system: "all",
};

/**
 * 日志服务类
 */
export class LogService {
  private config: LogServiceConfig;
  private logQueue: BaseLog[] = [];
  private batchTimer: Timer | null = null;

  constructor(config: Partial<LogServiceConfig> = {}) {
    this.config = {
      defaultStorage: "console_db",
      logDir: join(cwd(), "logs"),
      async: true,
      dbRetentionDays: 30,
      fileRetentionDays: 7,
      batchSize: 100,
      batchInterval: 5000, // 5秒
      ...config,
    };

    // 确保日志目录存在
    this.ensureLogDir();

    // 启动批量处理定时器
    if (this.config.async) {
      this.startBatchTimer();
    }

    // 注册清理函数到优雅退出服务
    gracefulShutdown.registerCleanup(() => this.stop(), "日志服务");
  }

  /**
   * 记录日志
   */
  async log(logData: { message: string; level: LogLevel; type: LogType } & Partial<Omit<BaseLog, "message" | "level" | "type">>): Promise<void> {
    const log: BaseLog = {
      id: uuidv7(),
      timestamp: new Date(),
      service: "jigu-server",
      environment: Bun.env.NODE_ENV || "development",
      ...logData,
    };

    // 确定存储策略
    const storage = this.determineStorage(log);

    if (this.config.async) {
      // 异步处理：加入队列
      this.logQueue.push(log);
      if (this.logQueue.length >= this.config.batchSize) {
        await this.flushQueue();
      }
    }
    else {
      // 同步处理
      await this.writeLog(log, storage);
    }
  }

  /**
   * 记录信息日志
   */
  async info(message: string, metadata?: Record<string, unknown>, type: LogType = "app"): Promise<void> {
    return this.log({ message, level: "info", type, metadata });
  }

  /**
   * 记录警告日志
   */
  async warn(message: string, metadata?: Record<string, unknown>, type: LogType = "app"): Promise<void> {
    return this.log({ message, level: "warn", type, metadata });
  }

  /**
   * 记录错误日志
   */
  async error(message: string, error?: Error, metadata?: Record<string, unknown>, type: LogType = "app"): Promise<void> {
    const logData = {
      message,
      level: "error" as const,
      type,
      metadata: {
        ...metadata,
        ...(error && {
          errorName: error.name,
          errorMessage: error.message,
        }),
      },
      stack: error?.stack,
    };

    return this.log(logData);
  }

  /**
   * 记录致命错误日志
   */
  async fatal(message: string, error?: Error, metadata?: Record<string, unknown>, type: LogType = "app"): Promise<void> {
    const logData = {
      message,
      level: "fatal" as const,
      type,
      metadata: {
        ...metadata,
        ...(error && {
          errorName: error.name,
          errorMessage: error.message,
        }),
      },
      stack: error?.stack,
    };

    return this.log(logData);
  }

  /**
   * 查询日志
   */
  async query(queryParams: LogQuery): Promise<{ logs: BaseLog[]; total: number }> {
    try {
      const collection = getCollection<BaseLog>("logs");

      // 构建查询条件
      const filter: Record<string, unknown> = {};

      if (queryParams.startTime || queryParams.endTime) {
        filter.timestamp = {};
        if (queryParams.startTime) {
          (filter.timestamp as any).$gte = queryParams.startTime;
        }
        if (queryParams.endTime) {
          (filter.timestamp as any).$lte = queryParams.endTime;
        }
      }

      if (queryParams.levels?.length) {
        filter.level = { $in: queryParams.levels };
      }

      if (queryParams.types?.length) {
        filter.type = { $in: queryParams.types };
      }

      if (queryParams.services?.length) {
        filter.service = { $in: queryParams.services };
      }

      if (queryParams.userId) {
        filter.userId = queryParams.userId;
      }

      if (queryParams.requestId) {
        filter.requestId = queryParams.requestId;
      }

      if (queryParams.keyword) {
        filter.$or = [
          { message: { $regex: queryParams.keyword, $options: "i" } },
          { "metadata.errorName": { $regex: queryParams.keyword, $options: "i" } },
        ];
      }

      // 分页参数
      const page = queryParams.page || 1;
      const limit = Math.min(queryParams.limit || 50, 1000); // 最大1000条
      const skip = (page - 1) * limit;

      // 排序
      const sortBy = queryParams.sortBy || "timestamp";
      const sortOrder = queryParams.sortOrder === "asc" ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      // 执行查询
      const [logs, total] = await Promise.all([
        collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter),
      ]);

      return { logs, total };
    }
    catch (error) {
      consola.error("Failed to query logs:", error);
      throw error;
    }
  }

  /**
   * 获取日志统计
   */
  async getStats(startTime?: Date, endTime?: Date): Promise<LogStats> {
    try {
      const collection = getCollection<BaseLog>("logs");

      const timeFilter: Record<string, unknown> = {};
      if (startTime || endTime) {
        timeFilter.timestamp = {};
        if (startTime) (timeFilter.timestamp as any).$gte = startTime;
        if (endTime) (timeFilter.timestamp as any).$lte = endTime;
      }

      const pipeline = [
        ...(Object.keys(timeFilter).length ? [{ $match: timeFilter }] : []),
        {
          $facet: {
            total: [{ $count: "count" }],
            byLevel: [
              { $group: { _id: "$level", count: { $sum: 1 } } },
            ],
            byType: [
              { $group: { _id: "$type", count: { $sum: 1 } } },
            ],
            byHour: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d %H:00:00",
                      date: "$timestamp",
                    },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              { $project: { hour: "$_id", count: 1, _id: 0 } },
            ],
            errorCount: [
              {
                $match: {
                  level: { $in: ["error", "fatal"] },
                },
              },
              { $count: "count" },
            ],
            avgResponseTime: [
              {
                $match: {
                  "type": "http",
                  "metadata.duration": { $exists: true },
                },
              },
              {
                $group: {
                  _id: null,
                  avgDuration: { $avg: "$metadata.duration" },
                },
              },
            ],
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();
      const stats = result[0];

      if (!stats) {
        throw new Error("Failed to get aggregation result");
      }

      const total = stats.total[0]?.count || 0;
      const errorCount = stats.errorCount[0]?.count || 0;

      const byLevel = Object.values(LOG_LEVELS).reduce((acc, level) => {
        acc[level] = stats.byLevel.find((item: any) => item._id === level)?.count || 0;
        return acc;
      }, {} as Record<LogLevel, number>);

      const byType = Object.values(LOG_TYPES).reduce((acc, type) => {
        acc[type] = stats.byType.find((item: any) => item._id === type)?.count || 0;
        return acc;
      }, {} as Record<LogType, number>);

      return {
        total,
        byLevel,
        byType,
        byHour: stats.byHour || [],
        errorRate: total > 0 ? (errorCount / total) * 100 : 0,
        avgResponseTime: stats.avgResponseTime[0]?.avgDuration || undefined,
      };
    }
    catch (error) {
      consola.error("Failed to get log stats:", error);
      throw error;
    }
  }

  /**
   * 清理过期日志
   */
  async cleanup(): Promise<{ deletedCount: number }> {
    try {
      const collection = getCollection<BaseLog>("logs");
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.dbRetentionDays);

      const result = await collection.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      consola.info(`Cleaned up ${result.deletedCount} old log entries`);
      return { deletedCount: result.deletedCount };
    }
    catch (error) {
      consola.error("Failed to cleanup logs:", error);
      throw error;
    }
  }

  /**
   * 刷新日志队列
   */
  async flushQueue(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToProcess = [...this.logQueue];
    this.logQueue = [];

    const promises = logsToProcess.map((log) => {
      const storage = this.determineStorage(log);
      return this.writeLog(log, storage);
    });

    await Promise.allSettled(promises);
  }

  /**
   * 确定存储策略
   */
  private determineStorage(log: BaseLog): LogStorage {
    // 优先按级别判断
    if (STORAGE_RULES[log.level]) {
      return STORAGE_RULES[log.level];
    }

    // 其次按类型判断
    if (STORAGE_RULES[log.type]) {
      return STORAGE_RULES[log.type];
    }

    // 默认策略
    return this.config.defaultStorage;
  }

  /**
   * 写入日志
   */
  private async writeLog(log: BaseLog, storage: LogStorage): Promise<void> {
    const promises: Promise<void>[] = [];

    // 控制台输出
    if (this.shouldWriteToConsole(storage)) {
      promises.push(this.writeToConsole(log));
    }

    // 数据库存储
    if (this.shouldWriteToDatabase(storage)) {
      promises.push(this.writeToDatabase(log));
    }

    // 文件存储
    if (this.shouldWriteToFile(storage)) {
      promises.push(this.writeToFile(log));
    }

    await Promise.allSettled(promises);
  }

  /**
   * 写入控制台
   */
  private async writeToConsole(log: BaseLog): Promise<void> {
    const logMethod = this.getConsolaMethod(log.level);
    const emoji = this.getLogEmoji(log.type, log.level);

    logMethod(`${emoji} [${log.type.toUpperCase()}] ${log.message}`, {
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      ...(log.metadata && { metadata: log.metadata }),
      ...(log.stack && { stack: log.stack }),
    });
  }

  /**
   * 写入数据库
   */
  private async writeToDatabase(log: BaseLog): Promise<void> {
    try {
      const collection = getCollection<BaseLog>("logs");
      await collection.insertOne(log);
    }
    catch (error) {
      consola.error("Failed to write log to database:", error);
    }
  }

  /**
   * 写入文件
   */
  private async writeToFile(log: BaseLog): Promise<void> {
    try {
      const date = log.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
      const filename = `${date}-${log.type}.log`;
      const filepath = join(this.config.logDir, filename);

      const logLine = `${JSON.stringify(log)}\n`;

      // 使用 Bun 的文件 API
      const file = Bun.file(filepath);
      const exists = await file.exists();

      if (exists) {
        // 追加模式：读取现有内容并追加
        const existingContent = await file.text();
        await Bun.write(filepath, existingContent + logLine);
      }
      else {
        // 新文件
        await Bun.write(filepath, logLine);
      }
    }
    catch (error) {
      consola.error("Failed to write log to file:", error);
    }
  }

  /**
   * 确保日志目录存在
   */
  private async ensureLogDir(): Promise<void> {
    try {
      // 使用 Bun 的文件系统 API 检查并创建目录
      await Bun.write(join(this.config.logDir, ".gitkeep"), "");
    }
    catch {
      // 如果失败，说明目录不存在，使用传统方式创建
      if (!existsSync(this.config.logDir)) {
        await mkdir(this.config.logDir, { recursive: true });
      }
    }
  }

  /**
   * 启动批量处理定时器
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushQueue().catch((error) => {
        consola.error("Failed to flush log queue:", error);
      });
    }, this.config.batchInterval);
  }

  /**
   * 停止批量处理定时器
   */
  async stop(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // 处理剩余的日志
    await this.flushQueue();
  }

  /**
   * 判断是否写入控制台
   */
  private shouldWriteToConsole(storage: LogStorage): boolean {
    return [
      "console_only",
      "console_db",
      "console_file",
      "all",
    ].includes(storage);
  }

  /**
   * 判断是否写入数据库
   */
  private shouldWriteToDatabase(storage: LogStorage): boolean {
    return [
      "database_only",
      "console_db",
      "all",
    ].includes(storage);
  }

  /**
   * 判断是否写入文件
   */
  private shouldWriteToFile(storage: LogStorage): boolean {
    return [
      "file_only",
      "console_file",
      "all",
    ].includes(storage);
  }

  /**
   * 获取 consola 方法
   */
  private getConsolaMethod(level: LogLevel) {
    switch (level) {
      case "debug":
        return consola.debug;
      case "info":
        return consola.info;
      case "warn":
        return consola.warn;
      case "error":
      case "fatal":
        return consola.error;
      default:
        return consola.info;
    }
  }

  /**
   * 获取日志 emoji
   */
  private getLogEmoji(type: LogType, level: LogLevel): string {
    if (level === "error" || level === "fatal") {
      return "❌";
    }

    switch (type) {
      case "http":
        return "🌐";
      case "auth":
        return "🔐";
      case "security":
        return "🛡️";
      case "db":
        return "🗄️";
      case "performance":
        return "⚡";
      case "system":
        return "⚙️";
      default:
        return "📝";
    }
  }
}

// 创建全局日志服务实例
export const logService = new LogService({
  async: true,
  defaultStorage: Bun.env.NODE_ENV === "production"
    ? "console_db"
    : "console_only",
});

// 注意：日志服务的优雅关闭现在由 graceful-shutdown 服务统一管理
