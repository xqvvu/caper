import type { Document } from "mongodb";
import type { CollectionName } from "@/shared/collection-names";
import consola from "consola";
import { MongoClient } from "mongodb";
import { MONGO_COLLECTION_NAMES } from "@/shared/collection-names";
import { gracefulShutdownService } from "@/shared/shutdown";

let mongoClient: MongoClient | null = null;

export async function initializeMongoClient() {
  try {
    if (!Bun.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required");
    }

    mongoClient = new MongoClient(Bun.env.MONGODB_URI);
    await mongoClient.connect();
    consola.success("已连接到 MongoDB");

    // 注册关闭清理函数到优雅退出服务
    gracefulShutdownService.registerCleanup(closeMongoClient, "MongoDB 连接");

    return mongoClient;
  }
  catch (error) {
    consola.error("连接 MongoDB 失败:", error);
    throw error;
  }
}

export function getMongo(): MongoClient {
  if (!mongoClient) {
    throw new Error("MongoDB client 未初始化. 请先调用 initializeDatabase()");
  }

  return mongoClient;
}

export function getDb() {
  return getMongo().db();
}

export function getCollection<T extends Document = Document>(name: CollectionName) {
  return getDb().collection<T>(MONGO_COLLECTION_NAMES[name]);
}

export async function closeMongoClient() {
  if (mongoClient) {
    try {
      await mongoClient.close();
      mongoClient = null;
      consola.success("MongoDB client 已关闭");
    }
    catch (error) {
      consola.error("关闭 MongoDB client 失败:", error);
      throw error;
    }
  }
}
