import type { Collection, Filter, UpdateFilter, WithId } from "mongodb";
import type { BaseDocument } from "@/dal/types";
import type { CollectionName } from "@/shared/collection-names";
import { ObjectId } from "mongodb";
import { getCollection } from "@/db/mongo";

export abstract class BaseDAL<T extends BaseDocument> {
  protected abstract collectionName: CollectionName;

  protected getCollection(): Collection<T> {
    return getCollection<T>(this.collectionName);
  }

  async findAll(filter: Filter<T> = {}): Promise<WithId<T>[]> {
    return this.getCollection().find(filter).toArray();
  }

  async findById(id: string | ObjectId): Promise<WithId<T> | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) } as Filter<T>);
  }

  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    return this.getCollection().findOne(filter);
  }

  async create(doc: Omit<T, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
    const now = new Date();
    const docWithTimestamps = {
      ...doc,
      createdAt: now,
      updatedAt: now,
    } as Omit<T, "_id">;

    const result = await this.getCollection().insertOne(docWithTimestamps as any);
    if (!result.insertedId) {
      throw new Error("Failed to create document");
    }
    return result.insertedId;
  }

  async updateById(
    id: string | ObjectId,
    updates: Partial<Omit<T, "_id" | "createdAt">>,
  ): Promise<boolean> {
    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id) } as Filter<T>,
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      } as UpdateFilter<T>,
    );
    return result.modifiedCount > 0;
  }

  async deleteById(id: string | ObjectId): Promise<boolean> {
    const result = await this.getCollection().deleteOne({ _id: new ObjectId(id) } as Filter<T>);
    return result.deletedCount > 0;
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    return this.getCollection().countDocuments(filter);
  }
}
