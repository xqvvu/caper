import type {
  CreateScriptInput,
  ScriptSearchByContentInput,
  ScriptSearchByNameInput,
  UpdateScriptInput,
} from "@jigu/shared/schemas";
import type { Filter } from "mongodb";
import type { ScriptDocument } from "@/dal/types";
import {
  CreateScriptSchema,
  ScriptSearchByContentSchema,
  ScriptSearchByNameSchema,
  UpdateScriptSchema,
} from "@jigu/shared/schemas";
import { BaseDAL } from "@/dal/base";

export class ScriptsDAL extends BaseDAL<ScriptDocument> {
  protected collectionName = "scripts" as const;

  validateCreateInput(input: unknown): CreateScriptInput {
    return CreateScriptSchema.parse(input);
  }

  validateUpdateInput(input: unknown): UpdateScriptInput {
    return UpdateScriptSchema.parse(input);
  }

  async createScript(input: unknown) {
    const validatedInput = this.validateCreateInput(input);
    return this.create(validatedInput);
  }

  async updateScript(id: string, input: unknown) {
    const validatedInput = this.validateUpdateInput(input);
    return this.updateById(id, validatedInput);
  }

  async searchByName(input: ScriptSearchByNameInput | string): Promise<ScriptDocument[]> {
    const params = typeof input === "string"
      ? { search: input }
      : ScriptSearchByNameSchema.parse(input);

    return this.findAll({
      name: { $regex: params.search, $options: "i" },
    } as Filter<ScriptDocument>);
  }

  async searchByContent(input: ScriptSearchByContentInput | string): Promise<ScriptDocument[]> {
    const params = typeof input === "string"
      ? { search: input }
      : ScriptSearchByContentSchema.parse(input);

    return this.findAll({
      content: { $regex: params.search, $options: "i" },
    } as Filter<ScriptDocument>);
  }
}

// 导出单例实例
export const scriptsDAL = new ScriptsDAL();
