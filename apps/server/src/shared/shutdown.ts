import process from "node:process";
import consola from "consola";

/**
 * 清理函数类型定义
 */
type CleanupFunction = () => Promise<void> | void;

/**
 * 优雅退出服务
 */
class GracefulShutdownService {
  private cleanupFunctions: CleanupFunction[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30秒超时
  private signals = ["SIGTERM", "SIGINT", "SIGUSR2"] as const;

  constructor() {
    this.setupSignalHandlers();
  }

  /**
   * 注册清理函数
   * @param cleanup 清理函数
   * @param name 清理函数名称（用于日志）
   */
  registerCleanup(cleanup: CleanupFunction, name?: string): void {
    const namedCleanup = async () => {
      try {
        consola.info(`执行清理: ${name || "未命名清理函数"}`);
        await cleanup();
        consola.success(`清理完成: ${name || "未命名清理函数"}`);
      }
      catch (error) {
        consola.error(`清理失败 ${name || "未命名清理函数"}:`, error);
        throw error;
      }
    };

    this.cleanupFunctions.push(namedCleanup);
    consola.debug(`注册清理函数: ${name || "未命名清理函数"}`);
  }

  /**
   * 设置关闭超时时间
   * @param timeout 超时时间（毫秒）
   */
  setShutdownTimeout(timeout: number): void {
    this.shutdownTimeout = timeout;
    consola.debug(`设置关闭超时时间: ${timeout}ms`);
  }

  /**
   * 手动触发优雅关闭
   */
  async shutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) {
      consola.warn("关闭流程已在进行中，忽略重复请求");
      return;
    }

    this.isShuttingDown = true;
    consola.info(`开始优雅关闭流程 ${signal ? `(信号: ${signal})` : ""}`);

    const shutdownPromise = this.executeCleanup();
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`关闭超时 (${this.shutdownTimeout}ms)`));
      }, this.shutdownTimeout);
    });

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      consola.success("优雅关闭完成");
      process.exit(0);
    }
    catch (error) {
      consola.error("关闭过程中发生错误:", error);
      process.exit(1);
    }
  }

  /**
   * 执行所有清理函数
   */
  private async executeCleanup(): Promise<void> {
    if (this.cleanupFunctions.length === 0) {
      consola.info("没有需要清理的资源");
      return;
    }

    consola.info(`开始执行 ${this.cleanupFunctions.length} 个清理函数`);

    // 并行执行所有清理函数，但设置合理的超时
    const cleanupPromises = this.cleanupFunctions.map(async (cleanup, index) => {
      try {
        await cleanup();
      }
      catch (error) {
        consola.error(`清理函数 ${index + 1} 执行失败:`, error);
        // 不抛出错误，继续执行其他清理函数
      }
    });

    await Promise.allSettled(cleanupPromises);
    consola.info("所有清理函数执行完成");
  }

  /**
   * 设置信号处理器
   */
  private setupSignalHandlers(): void {
    for (const signal of this.signals) {
      process.on(signal, () => {
        consola.info(`接收到信号: ${signal}`);
        this.shutdown(signal).catch((error) => {
          consola.error("信号处理器中的关闭流程失败:", error);
          process.exit(1);
        });
      });
    }

    // 处理未捕获的异常
    process.on("uncaughtException", (error) => {
      consola.fatal("未捕获的异常:", error);
      this.shutdown("uncaughtException").catch(() => {
        process.exit(1);
      });
    });

    // 处理未处理的Promise拒绝
    process.on("unhandledRejection", (reason, promise) => {
      consola.fatal("未处理的Promise拒绝:", reason, "在Promise:", promise);
      this.shutdown("unhandledRejection").catch(() => {
        process.exit(1);
      });
    });

    consola.debug(`信号处理器已设置: ${this.signals.join(", ")}`);
  }

  /**
   * 检查是否正在关闭
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}

// 导出单例实例
export const gracefulShutdownService = new GracefulShutdownService();

// 导出类型和默认实例
export type { CleanupFunction };
export { GracefulShutdownService };
