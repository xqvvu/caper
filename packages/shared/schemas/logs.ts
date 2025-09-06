import { z } from "zod";

/**
 * 日志级别
 */
export const LogLevelSchema = z.enum([
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

export type LogLevel = z.infer<typeof LogLevelSchema>;

/**
 * 日志类型
 */
export const LogTypeSchema = z.enum([
  "http", // HTTP 请求日志
  "app", // 应用程序日志
  "db", // 数据库操作日志
  "auth", // 认证授权日志
  "security", // 安全相关日志
  "performance", // 性能日志
  "system", // 系统日志
]);

export type LogType = z.infer<typeof LogTypeSchema>;

/**
 * 日志存储策略
 */
export const LogStorageSchema = z.enum([
  "console_only", // 仅控制台
  "database_only", // 仅数据库
  "file_only", // 仅文件
  "console_db", // 控制台+数据库
  "console_file", // 控制台+文件
  "all", // 全部存储
]);

export type LogStorage = z.infer<typeof LogStorageSchema>;

/**
 * 基础日志接口
 */
export const BaseLogSchema = z.object({
  /** 日志唯一标识 */
  id: z.string(),
  /** 日志级别 */
  level: LogLevelSchema,
  /** 日志类型 */
  type: LogTypeSchema,
  /** 日志消息 */
  message: z.string(),
  /** 时间戳 */
  timestamp: z.date(),
  /** 服务名称 */
  service: z.string(),
  /** 环境 */
  environment: z.string(),
  /** 额外数据 */
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** 用户ID（如果有） */
  userId: z.string().optional(),
  /** 会话ID */
  sessionId: z.string().optional(),
  /** 请求ID */
  requestId: z.string().optional(),
  /** 错误堆栈 */
  stack: z.string().optional(),
  /** IP地址 */
  ip: z.string().optional(),
  /** 用户代理 */
  userAgent: z.string().optional(),
});

export type BaseLog = z.infer<typeof BaseLogSchema>;

/**
 * HTTP 日志扩展
 */
export const HttpLogSchema = BaseLogSchema.extend({
  type: z.literal("http"),
  /** HTTP 方法 */
  method: z.string(),
  /** 请求路径 */
  path: z.string(),
  /** 完整URL */
  url: z.string(),
  /** 状态码 */
  status: z.number(),
  /** 响应时间（毫秒） */
  duration: z.number(),
  /** 请求体大小 */
  requestSize: z.number().optional(),
  /** 响应体大小 */
  responseSize: z.number().optional(),
  /** 请求头 */
  requestHeaders: z.record(z.string(), z.string()).optional(),
  /** 响应头 */
  responseHeaders: z.record(z.string(), z.string()).optional(),
  /** 请求体（敏感信息已脱敏） */
  requestBody: z.unknown().optional(),
  /** 响应体（截断后的） */
  responseBody: z.unknown().optional(),
});

export type HttpLog = z.infer<typeof HttpLogSchema>;

/**
 * 错误日志扩展
 */
export const ErrorLogSchema = BaseLogSchema.extend({
  level: z.enum(["error", "fatal"]),
  /** 错误名称 */
  errorName: z.string(),
  /** 错误代码 */
  errorCode: z.string().optional(),
  /** 文件路径 */
  file: z.string().optional(),
  /** 行号 */
  line: z.number().optional(),
  /** 列号 */
  column: z.number().optional(),
});

export type ErrorLog = z.infer<typeof ErrorLogSchema>;

/**
 * 性能日志扩展
 */
export const PerformanceLogSchema = BaseLogSchema.extend({
  type: z.literal("performance"),
  /** 操作名称 */
  operation: z.string(),
  /** 执行时间 */
  duration: z.number(),
  /** 内存使用 */
  memoryUsage: z.number().optional(),
  /** CPU 使用率 */
  cpuUsage: z.number().optional(),
});

export type PerformanceLog = z.infer<typeof PerformanceLogSchema>;

/**
 * 日志查询参数
 */
export const LogQuerySchema = z.object({
  /** 开始时间 */
  startTime: z.date().optional(),
  /** 结束时间 */
  endTime: z.date().optional(),
  /** 日志级别 */
  levels: z.array(LogLevelSchema).optional(),
  /** 日志类型 */
  types: z.array(LogTypeSchema).optional(),
  /** 服务名称 */
  services: z.array(z.string()).optional(),
  /** 用户ID */
  userId: z.string().optional(),
  /** 请求ID */
  requestId: z.string().optional(),
  /** 关键词搜索 */
  keyword: z.string().optional(),
  /** 分页参数 */
  page: z.number().optional(),
  /** 每页数量 */
  limit: z.number().optional(),
  /** 排序字段 */
  sortBy: z.string().optional(),
  /** 排序方向 */
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type LogQuery = z.infer<typeof LogQuerySchema>;

/**
 * 日志统计结果
 */
export const LogStatsSchema = z.object({
  /** 总数 */
  total: z.number(),
  /** 按级别分组统计 */
  byLevel: z.record(LogLevelSchema, z.number()),
  /** 按类型分组统计 */
  byType: z.record(LogTypeSchema, z.number()),
  /** 按小时分组统计 */
  byHour: z.array(z.object({
    hour: z.string(),
    count: z.number(),
  })),
  /** 错误率 */
  errorRate: z.number(),
  /** 平均响应时间 */
  avgResponseTime: z.number().optional(),
});

export type LogStats = z.infer<typeof LogStatsSchema>;

// 常量定义 - 使用 zod enum 的 options 属性
export const LOG_LEVELS = LogLevelSchema.enum;
export const LOG_TYPES = LogTypeSchema.enum;
export const LOG_STORAGES = LogStorageSchema.enum;

/**
 * 日志创建输入验证
 */
export const CreateLogInputSchema = BaseLogSchema.omit({
  id: true,
  timestamp: true,
  service: true,
  environment: true,
}).extend({
  message: z.string().min(1, "日志消息不能为空").max(1000, "日志消息过长"),
  level: LogLevelSchema,
  type: LogTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateLogInput = z.infer<typeof CreateLogInputSchema>;

/**
 * 日志查询输入验证
 */
export const LogQueryInputSchema = LogQuerySchema.extend({
  startTime: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endTime: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  levels: z.string().optional().transform(val =>
    val ? val.split(",").filter(level => LogLevelSchema.safeParse(level).success) as z.infer<typeof LogLevelSchema>[] : undefined,
  ),
  types: z.string().optional().transform(val =>
    val ? val.split(",").filter(type => LogTypeSchema.safeParse(type).success) as z.infer<typeof LogTypeSchema>[] : undefined,
  ),
  services: z.string().optional().transform(val => val ? val.split(",") : undefined),
  page: z.string().optional().transform(val => val ? Number.parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => {
    const num = val ? Number.parseInt(val, 10) : 50;
    return Math.min(Math.max(num, 1), 1000); // 限制在 1-1000 之间
  }),
});

export type LogQueryInput = z.infer<typeof LogQueryInputSchema>;

/**
 * 日志统计查询输入验证
 */
export const LogStatsQuerySchema = z.object({
  startTime: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endTime: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export type LogStatsQuery = z.infer<typeof LogStatsQuerySchema>;

/**
 * HTTP 日志创建输入
 */
export const CreateHttpLogInputSchema = CreateLogInputSchema.extend({
  type: z.literal("http"),
  method: z.string().min(1),
  path: z.string().min(1),
  url: z.string().url(),
  status: z.number().int().min(100).max(599),
  duration: z.number().positive(),
  requestSize: z.number().int().positive().optional(),
  responseSize: z.number().int().positive().optional(),
});

export type CreateHttpLogInput = z.infer<typeof CreateHttpLogInputSchema>;

/**
 * 错误日志创建输入
 */
export const CreateErrorLogInputSchema = CreateLogInputSchema.extend({
  level: z.enum(["error", "fatal"]),
  errorName: z.string().min(1),
  errorCode: z.string().optional(),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  column: z.number().int().positive().optional(),
  stack: z.string().optional(),
});

export type CreateErrorLogInput = z.infer<typeof CreateErrorLogInputSchema>;

/**
 * 性能日志创建输入
 */
export const CreatePerformanceLogInputSchema = CreateLogInputSchema.extend({
  type: z.literal("performance"),
  operation: z.string().min(1),
  duration: z.number().positive(),
  memoryUsage: z.number().positive().optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
});

export type CreatePerformanceLogInput = z.infer<typeof CreatePerformanceLogInputSchema>;

/**
 * 批量日志输入验证
 */
export const BatchLogInputSchema = z.object({
  logs: z.array(CreateLogInputSchema).min(1).max(100), // 最多100条日志
});

export type BatchLogInput = z.infer<typeof BatchLogInputSchema>;

/**
 * 日志响应格式
 */
export const LogResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string(),
  error: z.string().optional(),
});

export type LogResponse = z.infer<typeof LogResponseSchema>;

/**
 * 日志列表响应
 */
export const LogListResponseSchema = LogResponseSchema.extend({
  data: z.object({
    logs: z.array(BaseLogSchema),
    total: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional(),
});

export type LogListResponse = z.infer<typeof LogListResponseSchema>;

/**
 * 日志统计响应
 */
export const LogStatsResponseSchema = LogResponseSchema.extend({
  data: LogStatsSchema.optional(),
});

export type LogStatsResponse = z.infer<typeof LogStatsResponseSchema>;

// 导出验证工具函数
export function validateLogInput(input: unknown): CreateLogInput {
  return CreateLogInputSchema.parse(input);
}

export function validateLogQuery(input: unknown): LogQueryInput {
  return LogQueryInputSchema.parse(input);
}

export function validateHttpLogInput(input: unknown): CreateHttpLogInput {
  return CreateHttpLogInputSchema.parse(input);
}

export function validateErrorLogInput(input: unknown): CreateErrorLogInput {
  return CreateErrorLogInputSchema.parse(input);
}

export function validatePerformanceLogInput(input: unknown): CreatePerformanceLogInput {
  return CreatePerformanceLogInputSchema.parse(input);
}

export function validateBatchLogInput(input: unknown): BatchLogInput {
  return BatchLogInputSchema.parse(input);
}
