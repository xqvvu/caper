import { BaseDAL } from "../base";
import type { ScriptDocument } from "../types";
import type { Filter } from "mongodb";

export class ScriptsDAL extends BaseDAL<ScriptDocument> {
  protected collectionName = "SCRIPTS" as const;

  // 按语言查找脚本
  async findByLanguage(language: string): Promise<ScriptDocument[]> {
    return this.findAll({ language });
  }

  // 按标签查找脚本
  async findByTags(tags: string[]): Promise<ScriptDocument[]> {
    return this.findAll({ tags: { $in: tags } } as Filter<ScriptDocument>);
  }

  // 按名称搜索脚本
  async searchByName(query: string): Promise<ScriptDocument[]> {
    return this.findAll({
      name: { $regex: query, $options: "i" }
    } as Filter<ScriptDocument>);
  }

  // 按内容搜索脚本
  async searchByContent(query: string): Promise<ScriptDocument[]> {
    return this.findAll({
      content: { $regex: query, $options: "i" }
    } as Filter<ScriptDocument>);
  }
}

// 导出单例实例
export const scriptsDAL = new ScriptsDAL();
