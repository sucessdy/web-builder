
import { z } from "zod";

export const styleSchema = z
  .object({
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    lineHeight: z.union([z.string(), z.number()]).optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    borderRadius: z.string().optional(),
    border: z.string().optional(),
    width: z.string().optional(),
    maxWidth: z.string().optional(),
    minHeight: z.string().optional(),
    display: z.enum(["block", "flex", "grid", "inline-flex"]).optional(),
    flexDirection: z.enum(["row", "column"]).optional(),
    gap: z.string().optional(),
  })
  .strict();

export type NodeStyles = z.infer<typeof styleSchema>;
