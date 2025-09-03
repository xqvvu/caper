import type { Document, ObjectId } from "mongodb";

export interface BaseDocument extends Document {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScriptDocument extends BaseDocument {
  name: string;
  content: string;
  language: string;
  tags?: string[];
  description?: string;
}
