import path from "node:path";
import process from "node:process";
import consola from "consola";

const signal = "SIGTERM" as const;
const dotPID = path.resolve(import.meta.dir, "../apps/server/.pid");

async function shutdown() {
  try {
    const pid = Number(await Bun.file(dotPID).text());
    if (pid && !Number.isNaN(pid)) {
      process.kill(pid, signal);
    }
    else {
      throw new Error("PID not found or invalid");
    }
    await Bun.file(dotPID).delete();
    consola.success("Shutdown successfully");
    process.exit(0);
  }
  catch (error) {
    consola.error("Failed to shutdown:", error);
    process.exit(1);
  }
}

shutdown();
