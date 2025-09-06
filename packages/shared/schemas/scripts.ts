import { z } from "zod";
import { BaseDocumentSchema } from "./base";

// Script document schema
export const ScriptDocumentSchema = BaseDocumentSchema.extend({
  name: z.string().min(1, "Script name is required").max(255, "Script name too long"),
  content: z.string().min(1, "Script content is required"),
  openedAt: z.date().default(new Date()),
});

// Input schemas for creating and updating scripts
export const CreateScriptSchema = ScriptDocumentSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateScriptSchema = CreateScriptSchema.partial();

// Search schemas
export const ScriptSearchByNameSchema = z.object({
  search: z.string().min(1, "Search name is required"),
});

export const ScriptSearchByContentSchema = z.object({
  search: z.string().min(1, "Search content is required"),
});

// Inferred types
export type ScriptDocument = z.infer<typeof ScriptDocumentSchema>;
export type CreateScriptInput = z.infer<typeof CreateScriptSchema>;
export type UpdateScriptInput = z.infer<typeof UpdateScriptSchema>;
export type ScriptSearchByNameInput = z.infer<typeof ScriptSearchByNameSchema>;
export type ScriptSearchByContentInput = z.infer<typeof ScriptSearchByContentSchema>;
