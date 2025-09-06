import type { Context, Next } from "hono";
import { LOG_LEVELS, LOG_TYPES, uuidv7 } from "@jigu/shared";
import { consola } from "consola";
import { logService } from "@/services/logs";

export interface LoggerOptions {
  /**
   * 是否记录请求体
   */
  logBody?: boolean;
  /**
   * 是否记录响应体
   */
  logResponse?: boolean;
  /**
   * 是否记录请求头
   */
  logHeaders?: boolean;
  /**
   * 排除的路径模式
   */
  excludePaths?: (string | RegExp)[];
  /**
   * 慢请求阈值 (毫秒)
   */
  slowRequestThreshold?: number;
  /**
   * 是否启用数据库日志存储
   */
  enableDbLogging?: boolean;
  /**
   * 是否启用文件日志存储
   */
  enableFileLogging?: boolean;
}

const defaultOptions: LoggerOptions = {
  logBody: false,
  logResponse: false,
  logHeaders: false,
  excludePaths: ["/health", "/ping"],
  slowRequestThreshold: 1000, // 1秒
  enableDbLogging: true,
  enableFileLogging: false,
};

/**
 * 检查路径是否应该被排除
 */
function shouldExcludePath(path: string, excludePaths: (string | RegExp)[]): boolean {
  return excludePaths.some((pattern) => {
    if (typeof pattern === "string") {
      return path === pattern || path.startsWith(pattern);
    }
    return pattern.test(path);
  });
}

/**
 * 格式化请求体，避免记录敏感信息
 */
function formatRequestBody(body: unknown): unknown {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sensitiveFields = ["password", "token", "secret", "key", "auth"];
  const formatted = { ...body as Record<string, unknown> };

  for (const field of sensitiveFields) {
    if (field in formatted) {
      formatted[field] = "***";
    }
  }

  return formatted;
}

/**
 * 获取客户端IP地址
 */
function getClientIP(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    || c.req.header("x-real-ip")
    || c.req.header("cf-connecting-ip")
    || "unknown"
  );
}

/**
 * 创建 consola 日志中间件
 */
export function createLogger(options: LoggerOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return async (c: Context, next: Next) => {
    const { method, url, path } = c.req;

    // 检查是否需要排除此路径
    if (shouldExcludePath(path, opts.excludePaths || [])) {
      return next();
    }

    const startTime = Date.now();
    const requestId = uuidv7();
    const clientIP = getClientIP(c);

    // 设置请求ID到上下文中，方便后续使用
    c.set("requestId", requestId);

    // 构建基础日志信息
    const baseLogInfo = {
      requestId,
      method,
      path,
      url,
      ip: clientIP,
      userAgent: c.req.header("user-agent") || "unknown",
    };

    // 记录请求开始
    const requestLog: Record<string, unknown> = { ...baseLogInfo };

    if (opts.logHeaders) {
      const headers = c.req.header();
      requestLog.headers = headers;
    }

    if (opts.logBody && ["POST", "PUT", "PATCH"].includes(method)) {
      try {
        const body = await c.req.json().catch(() => null);
        if (body) {
          requestLog.body = formatRequestBody(body);
        }
      }
      catch {
        // 忽略解析错误
      }
    }

    consola.info("📨 Request started", requestLog);

    // 记录到日志服务（仅启动日志，完成日志在 finally 中记录）
    if (opts.enableDbLogging) {
      // 异步记录，不阻塞请求
      logService.log({
        message: `${method} ${path} - Request started`,
        level: LOG_LEVELS.info,
        type: LOG_TYPES.http,
        requestId,
        ip: clientIP,
        userAgent: baseLogInfo.userAgent,
        metadata: {
          method,
          path,
          url,
          requestStart: true,
        },
      }).catch((err) => {
        consola.error("Failed to log request start:", err);
      });
    }

    let status = 200;
    let error: Error | null = null;

    try {
      await next();
      status = c.res.status;
    }
    catch (err) {
      error = err as Error;
      status = 500;
      throw err;
    }
    finally {
      const duration = Date.now() - startTime;
      const isSlowRequest = duration > (opts.slowRequestThreshold || 1000);

      // 构建响应日志信息
      const responseLog: Record<string, unknown> = {
        ...baseLogInfo,
        status,
        duration: `${duration}ms`,
        contentLength: c.res.headers.get("content-length") || "unknown",
      };

      if (opts.logResponse && status < 400) {
        try {
          // 注意：读取响应体可能会影响性能，谨慎使用
          const response = await c.res.clone().text();
          if (response) {
            responseLog.response = response.length > 1000
              ? `${response.slice(0, 1000)}...`
              : response;
          }
        }
        catch {
          // 忽略解析错误
        }
      }

      // 根据状态码和错误情况选择不同的日志级别
      if (error) {
        consola.error("❌ Request failed", {
          ...responseLog,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        });
      }
      else if (status >= 500) {
        consola.error("🔥 Server error", responseLog);
      }
      else if (status >= 400) {
        consola.warn("⚠️  Client error", responseLog);
      }
      else if (isSlowRequest) {
        consola.warn("🐌 Slow request", responseLog);
      }
      else {
        consola.success("✅ Request completed", responseLog);
      }

      // 记录到日志服务
      if (opts.enableDbLogging) {
        const logLevel = error || status >= 500
          ? LOG_LEVELS.error
          : status >= 400
            ? LOG_LEVELS.warn
            : isSlowRequest
              ? LOG_LEVELS.warn
              : LOG_LEVELS.info;

        const httpLog = {
          message: error
            ? `${method} ${path} - Request failed: ${error.message}`
            : `${method} ${path} - ${status}`,
          level: logLevel,
          type: LOG_TYPES.http,
          requestId,
          ip: clientIP,
          userAgent: baseLogInfo.userAgent as string,
          metadata: {
            method,
            path,
            url,
            status,
            duration: `${duration}ms`,
            isSlowRequest,
            contentLength: responseLog.contentLength,
            requestSize: opts.logBody && requestLog.body
              ? JSON.stringify(requestLog.body).length
              : undefined,
            responseSize: responseLog.contentLength !== "unknown"
              ? Number(responseLog.contentLength) || undefined
              : undefined,
            requestHeaders: opts.logHeaders ? requestLog.headers : undefined,
            requestBody: opts.logBody ? requestLog.body : undefined,
            responseBody: opts.logResponse ? responseLog.response : undefined,
            ...(error && {
              errorName: error.name,
              errorMessage: error.message,
            }),
          },
          ...(error && { stack: error.stack }),
        };

        // 异步记录，不阻塞响应
        logService.log(httpLog).catch((err) => {
          consola.error("Failed to log HTTP request:", err);
        });
      }
    }
  };
}

/**
 * 默认日志中间件实例
 */
export const logger = createLogger();

/**
 * 开发环境日志中间件（更详细的日志）
 */
export const devLogger = createLogger({
  logBody: true,
  logHeaders: true,
  logResponse: false, // 响应体日志可能影响性能
  slowRequestThreshold: 500, // 开发环境对慢请求更敏感
});

/**
 * 生产环境日志中间件（精简日志）
 */
export const prodLogger = createLogger({
  logBody: false,
  logHeaders: false,
  logResponse: false,
  excludePaths: ["/health", "/ping", "/metrics"],
  slowRequestThreshold: 2000, // 生产环境阈值更高
});
