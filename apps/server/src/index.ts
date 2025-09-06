import path from "node:path";
import process from "node:process";
import consola from "consola";
import { Hono } from "hono";
import { initializeMongoClient } from "@/db/mongo";
import { devLogger } from "@/middleware";
import logs from "@/routes/logs";
import v1 from "@/routes/v1";
import { gracefulShutdownService } from "@/shared/shutdown";

const app = new Hono();

app.use("*", devLogger);

app.route("/api/v1", v1);
app.route("/api/logs", logs);

async function startServer() {
  try {
    await initializeMongoClient();

    const port = Bun.env.SERVER_PORT || 23002;
    const server = Bun.serve({
      fetch: app.fetch,
      port,
    });

    // 注册服务器关闭到优雅退出服务
    gracefulShutdownService.registerCleanup(async () => {
      consola.info("关闭 HTTP 服务器...");
      server.stop();
    }, "HTTP服务器");

    await Bun.write(path.resolve(import.meta.dir, "../.pid"), `${process.pid}`);

    consola.success(`服务器启动成功，端口: ${port}`);
    consola.info("按 Ctrl+C 优雅退出服务");

    return server;
  }
  catch (error) {
    consola.error("服务器启动失败:", error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  consola.error("启动过程中发生错误:", error);
  process.exit(1);
});
