import { z } from "zod";
import { styleSchema } from "@visual-builder/document-schema";
import presetData from "./insert-presets.json";

const insertPresetSchema = z.object({
  id: z.enum(["text-link", "blockquote"]),
  label: z.string().min(1),
  category: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  type: z.enum(["text", "button"]),
  text: z.string(),
  href: z.string().optional(),
  variant: z.enum(["primary", "secondary", "outline"]).optional(),
  styles: styleSchema,
}).strict();

export const insertPresets = z.array(insertPresetSchema).parse(presetData);
export type InsertPresetId = (typeof insertPresets)[number]["id"];
