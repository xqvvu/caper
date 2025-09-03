import { Hono } from "hono";
import consola from "consola";
import { scriptsDAL } from "@/dal/collections/scripts";
import { R } from "@/shared/utils";

const scripts = new Hono().basePath("/scripts");

// 获取所有脚本
scripts.get("/", async (c) => {
  try {
    const { language, tags, search } = c.req.query();

    let allScripts;

    if (language) {
      allScripts = await scriptsDAL.findByLanguage(language);
    } else if (tags) {
      const tagArray = tags.split(",").map(tag => tag.trim());
      allScripts = await scriptsDAL.findByTags(tagArray);
    } else if (search) {
      const nameResults = await scriptsDAL.searchByName(search);
      const contentResults = await scriptsDAL.searchByContent(search);
      // 合并结果并去重
      const uniqueScripts = new Map();
      [...nameResults, ...contentResults].forEach(script => {
        uniqueScripts.set(script._id?.toString(), script);
      });
      allScripts = Array.from(uniqueScripts.values());
    } else {
      allScripts = await scriptsDAL.findAll();
    }

    return R.ok(c, allScripts);
  } catch (error) {
    consola.error("Error fetching scripts:", error);
    return R.fail(c, 500, "Failed to fetch scripts");
  }
});

// 获取单个脚本
scripts.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const script = await scriptsDAL.findById(id);

    if (!script) {
      return R.fail(c, 404, "Script not found");
    }

    return R.ok(c, script);
  } catch (error) {
    consola.error("Error fetching script:", error);
    return R.fail(c, 500, "Failed to fetch script");
  }
});

// 创建新脚本
scripts.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, content, language, tags, description } = body;

    if (!name || !content || !language) {
      return R.fail(c, 400, "Missing required fields: name, content, language");
    }

    const scriptId = await scriptsDAL.create({
      name,
      content,
      language,
      tags,
      description,
    });

    return R.ok(c, { id: scriptId, message: "Script created successfully" });
  } catch (error) {
    consola.error("Error creating script:", error);
    return R.fail(c, 500, "Failed to create script");
  }
});

// 更新脚本
scripts.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const success = await scriptsDAL.updateById(id, body);

    if (!success) {
      return R.fail(c, 404, "Script not found or update failed");
    }

    return R.ok(c, { message: "Script updated successfully" });
  } catch (error) {
    consola.error("Error updating script:", error);
    return R.fail(c, 500, "Failed to update script");
  }
});

// 删除脚本
scripts.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const success = await scriptsDAL.deleteById(id);

    if (!success) {
      return R.fail(c, 404, "Script not found");
    }

    return R.ok(c, { message: "Script deleted successfully" });
  } catch (error) {
    consola.error("Error deleting script:", error);
    return R.fail(c, 500, "Failed to delete script");
  }
});

// 获取脚本统计信息
scripts.get("/stats/overview", async (c) => {
  try {
    const totalScripts = await scriptsDAL.count();
    const allScripts = await scriptsDAL.findAll();
    const languageStats = allScripts.reduce((acc, script) => {
      acc[script.language] = (acc[script.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return R.ok(c, {
      totalScripts,
      languageStats,
    });
  } catch (error) {
    consola.error("Error fetching stats:", error);
    return R.fail(c, 500, "Failed to fetch stats");
  }
});

export default scripts;
