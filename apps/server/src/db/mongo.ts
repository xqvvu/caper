import type { Document } from "mongodb";
import type { CollectionName } from "@/constants/collections";
import consola from "consola";

import { MongoClient } from "mongodb";
import { MONGO_COLLECTIONS } from "@/constants/collections";

let mongoClient: MongoClient | null = null;

// 初始化MongoDB连接
export async function initializeDatabase() {
  try {
    if (!Bun.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required");
    }

    mongoClient = new MongoClient(Bun.env.MONGODB_URI);
    await mongoClient.connect();
    consola.success("Connected to MongoDB");

    return mongoClient;
  }
  catch (error) {
    consola.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function getMongo(): MongoClient {
  if (!mongoClient) {
    throw new Error("MongoDB client is not initialized. Call initializeDatabase() first.");
  }
  return mongoClient;
}

export function getDb() {
  return getMongo().db();
}

export function getCollection<T extends Document = Document>(name: CollectionName) {
  return getDb().collection<T>(MONGO_COLLECTIONS[name]);
}
