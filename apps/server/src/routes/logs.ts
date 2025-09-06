import { zValidator } from "@hono/zod-validator";
import { CreateLogInputSchema, LogQueryInputSchema } from "@jigu/shared";
import { Hono } from "hono";
import { services } from "@/services";

const logs = new Hono();

/**
 * 查询日志
 * GET /api/v1/logs
 */
logs.get("/", zValidator("query", LogQueryInputSchema), async (c) => {
  try {
    const validatedQuery = c.req.valid("query");
    const result = await services.logs.query(validatedQuery);

    return c.json({
      success: true,
      data: result,
      message: "Logs retrieved successfully",
    });
  }
  catch (error) {
    console.error("Failed to query logs:", error);
    return c.json({
      success: false,
      error: "Failed to query logs",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

/**
 * 获取日志统计
 * GET /api/v1/logs/stats
 */
logs.get("/stats", async (c) => {
  try {
    const query = c.req.query();

    const startTime = query.startTime ? new Date(query.startTime) : undefined;
    const endTime = query.endTime ? new Date(query.endTime) : undefined;

    const stats = await services.logs.getStats(startTime, endTime);

    return c.json({
      success: true,
      data: stats,
      message: "Log statistics retrieved successfully",
    });
  }
  catch (error) {
    console.error("Failed to get log stats:", error);
    return c.json({
      success: false,
      error: "Failed to get log statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

/**
 * 清理过期日志
 * DELETE /api/v1/logs/cleanup
 */
logs.delete("/cleanup", async (c) => {
  try {
    const result = await services.logs.cleanup();

    return c.json({
      success: true,
      data: result,
      message: `Successfully cleaned up ${result.deletedCount} log entries`,
    });
  }
  catch (error) {
    console.error("Failed to cleanup logs:", error);
    return c.json({
      success: false,
      error: "Failed to cleanup logs",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

/**
 * 手动记录日志 (用于测试或特殊情况)
 * POST /api/v1/logs
 */
logs.post("/", zValidator("json", CreateLogInputSchema), async (c) => {
  try {
    const validatedBody = c.req.valid("json");

    await services.logs.log({
      ...validatedBody,
      requestId: c.get("requestId"),
    });

    return c.json({
      success: true,
      message: "Log recorded successfully",
    });
  }
  catch (error) {
    console.error("Failed to record log:", error);
    return c.json({
      success: false,
      error: "Failed to record log",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

export default logs;
