import { zValidator } from "@hono/zod-validator";
import { ServiceCode } from "@jigu/shared";
import { CreateScriptSchema } from "@jigu/shared/schemas";
import consola from "consola";
import { Hono } from "hono";
import { services } from "@/services";
import { R } from "@/shared/utils";

const scripts = new Hono();

// 获取所有脚本
scripts.get("/", async (c) => {
  try {
    const { search } = c.req.query();

    const allScripts = await services.scripts.getAllScripts({ search });

    return R.ok(c, allScripts);
  }
  catch (error) {
    consola.error("Error fetching scripts:", error);
    return R.fail(c, ServiceCode.INTERNAL_SERVER_ERROR, "Failed to fetch scripts");
  }
});

// 获取单个脚本
scripts.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const script = await services.scripts.getScriptById(id);

    if (!script) {
      return R.fail(c, ServiceCode.NOT_FOUND, "Script not found");
    }

    return R.ok(c, script);
  }
  catch (error) {
    consola.error("Error fetching script:", error);
    return R.fail(c, ServiceCode.INTERNAL_SERVER_ERROR, "Failed to fetch script");
  }
});

// 创建新脚本
scripts.post("/", zValidator("json", CreateScriptSchema), async (c) => {
  try {
    const body = c.req.valid("json");

    const scriptId = await services.scripts.createScript(body);

    return R.ok(c, { id: scriptId, message: "Script created successfully" });
  }
  catch (error) {
    // Zod validation errors will have detailed messages
    if (error instanceof Error && error.name === "ZodError") {
      return R.fail(c, ServiceCode.BAD_REQUEST, `Validation error: ${error.message}`);
    }
    consola.error("Error creating script:", error);
    return R.fail(c, ServiceCode.INTERNAL_SERVER_ERROR, "Failed to create script");
  }
});

// 更新脚本
scripts.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const success = await services.scripts.updateScript(id, body);

    if (!success) {
      return R.fail(c, ServiceCode.NOT_FOUND, "Script not found or update failed");
    }

    return R.ok(c, { message: "Script updated successfully" });
  }
  catch (error) {
    // Zod validation errors will have detailed messages
    if (error instanceof Error && error.name === "ZodError") {
      return R.fail(c, ServiceCode.BAD_REQUEST, `Validation error: ${error.message}`);
    }
    consola.error("Error updating script:", error);
    return R.fail(c, ServiceCode.INTERNAL_SERVER_ERROR, "Failed to update script");
  }
});

// 删除脚本
scripts.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const success = await services.scripts.deleteScript(id);

    if (!success) {
      return R.fail(c, ServiceCode.NOT_FOUND, "Script not found");
    }

    return R.ok(c, { message: "Script deleted successfully" });
  }
  catch (error) {
    consola.error("Error deleting script:", error);
    return R.fail(c, ServiceCode.INTERNAL_SERVER_ERROR, "Failed to delete script");
  }
});

// 获取脚本统计信息
scripts.get("/stats/overview", async (c) => {
  try {
    const stats = await services.scripts.getScriptStats();

    return R.ok(c, stats);
  }
  catch (error) {
    consola.error("Error fetching stats:", error);
    return R.fail(c, ServiceCode.INTERNAL_SERVER_ERROR, "Failed to fetch stats");
  }
});

export default scripts;
