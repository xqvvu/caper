import { z } from "zod";

export const BaseDocumentSchema = z.object({
  _id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseDocument = z.infer<typeof BaseDocumentSchema>;
