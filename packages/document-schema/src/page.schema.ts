
import { z } from "zod";
import { pageNodeSchema } from "./node.schema";

export const pageDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    metadata: z
      .object({
        title: z.string().min(1),
      })
      .strict(),
    root: pageNodeSchema,
  })
  .strict();

export type PageDocument = z.infer<typeof pageDocumentSchema>;
