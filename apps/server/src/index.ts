import consola from "consola";
import { Hono } from "hono";
import { logger } from "hono/logger";
import v1 from "@/routes/v1";
import { initializeDatabase } from "@/db/mongo";

const app = new Hono();

app.use(logger());

app.route("/api", v1);

// 初始化数据库连接
await initializeDatabase();

Bun.serve({
  fetch: app.fetch,
  port: Bun.env.SERVER_PORT || 23002,
});
