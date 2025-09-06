export const MONGO_COLLECTION_NAMES = {
  scripts: "scripts",
  logs: "logs",
} as const;

export type CollectionName = keyof typeof MONGO_COLLECTION_NAMES;
