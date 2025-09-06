import type {
  ScriptDocument as ApiScriptDocument,
  ScriptSearchByContentInput,
  ScriptSearchByNameInput,
} from "@jigu/shared/schemas";
import type { ScriptDocument } from "@/dal/types";
import { scriptsDAL } from "@/dal/collections/scripts";
import { BaseService } from "./base";

/**
 * Scripts service layer - handles business logic for script operations
 */
export class ScriptsService extends BaseService {
  /**
   * Convert MongoDB ScriptDocument to API ScriptDocument format
   */
  private convertToApiFormat(doc: ScriptDocument): ApiScriptDocument {
    return {
      ...doc,
      _id: doc._id.toString(),
    };
  }

  /**
   * Convert array of MongoDB ScriptDocuments to API format
   */
  private convertArrayToApiFormat(docs: ScriptDocument[]): ApiScriptDocument[] {
    return docs.map(doc => this.convertToApiFormat(doc));
  }

  /**
   * Get all scripts with optional filtering
   */
  async getAllScripts(filters?: { search?: string }): Promise<ApiScriptDocument[]> {
    try {
      if (filters?.search) {
        const nameResults = await scriptsDAL.searchByName(filters.search);
        const contentResults = await scriptsDAL.searchByContent(filters.search);

        const uniqueScripts = new Map<string, ScriptDocument>();
        [...nameResults, ...contentResults].forEach((script) => {
          if (script._id) {
            uniqueScripts.set(script._id.toString(), script);
          }
        });

        return this.convertArrayToApiFormat(Array.from(uniqueScripts.values()));
      }

      const results = await scriptsDAL.findAll();
      return this.convertArrayToApiFormat(results);
    }
    catch (error) {
      this.handleError(error, "Failed to fetch scripts");
    }
  }

  /**
   * Get a single script by ID
   */
  async getScriptById(id: string): Promise<ApiScriptDocument | null> {
    try {
      const result = await scriptsDAL.findById(id);
      return result ? this.convertToApiFormat(result) : null;
    }
    catch (error) {
      this.handleError(error, "Failed to fetch script");
    }
  }

  /**
   * Create a new script
   */
  async createScript(input: unknown): Promise<string> {
    try {
      // Validation is handled in DAL layer
      const result = await scriptsDAL.createScript(input);
      return result.toString();
    }
    catch (error) {
      this.handleError(error, "Failed to create script");
    }
  }

  /**
   * Update an existing script
   */
  async updateScript(id: string, input: unknown): Promise<boolean> {
    try {
      // Validation is handled in DAL layer
      return await scriptsDAL.updateScript(id, input);
    }
    catch (error) {
      this.handleError(error, "Failed to update script");
    }
  }

  /**
   * Delete a script by ID
   */
  async deleteScript(id: string): Promise<boolean> {
    try {
      return await scriptsDAL.deleteById(id);
    }
    catch (error) {
      this.handleError(error, "Failed to delete script");
    }
  }

  /**
   * Get script statistics and overview
   */
  async getScriptStats(): Promise<{
    totalScripts: number;
    theLastUpdatedScriptDate: Date;
  }> {
    try {
      const totalScripts = await scriptsDAL.count();
      const allScripts = await scriptsDAL.findAll();

      // get the last updated script date
      const theLastUpdatedScriptDate = allScripts.reduce((acc, script) => {
        return script.updatedAt ? new Date(script.updatedAt) : acc;
      }, new Date(0));

      return {
        totalScripts,
        theLastUpdatedScriptDate,
      };
    }
    catch (error) {
      this.handleError(error, "Failed to fetch script statistics");
    }
  }

  /**
   * Search scripts by name
   */
  async searchByName(input: ScriptSearchByNameInput | string): Promise<ApiScriptDocument[]> {
    try {
      const results = await scriptsDAL.searchByName(input);
      return this.convertArrayToApiFormat(results);
    }
    catch (error) {
      this.handleError(error, "Failed to search scripts by name");
    }
  }

  /**
   * Search scripts by content
   */
  async searchByContent(input: ScriptSearchByContentInput | string): Promise<ApiScriptDocument[]> {
    try {
      const results = await scriptsDAL.searchByContent(input);
      return this.convertArrayToApiFormat(results);
    }
    catch (error) {
      this.handleError(error, "Failed to search scripts by content");
    }
  }
}

// Export singleton instance
export const scriptsService = new ScriptsService();
