export const MONGO_COLLECTIONS = {
  SCRIPTS: "scripts",
} as const;

export type CollectionName = keyof typeof MONGO_COLLECTIONS;
