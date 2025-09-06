import type { ScriptDocument as SharedScriptDocument } from "@jigu/shared/schemas";
import type { Document, ObjectId } from "mongodb";

export interface BaseDocument extends Document {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptDocument extends Omit<SharedScriptDocument, "_id" | "createdAt" | "updatedAt">, BaseDocument {}
