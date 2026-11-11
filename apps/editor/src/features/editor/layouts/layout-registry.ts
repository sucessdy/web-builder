import { z } from "zod";
import { styleSchema, type NodeStyles } from "@visual-builder/document-schema";
import presetData from "./layout-presets.json";

export const layoutIds = ["two-columns", "quick-stack", "quick-grid"] as const;
export type LayoutId = (typeof layoutIds)[number];

export type LayoutNodeTemplate = {
  key: string;
  name: string;
  styleRef?: string;
  styles?: NodeStyles;
  children?: LayoutNodeTemplate[];
};

export type LayoutPreset = {
  id: LayoutId;
  label: string;
  description: string;
  initialSelection: string;
  styleTokens?: Record<string, NodeStyles>;
  root: LayoutNodeTemplate;
};

const layoutNodeSchema: z.ZodType<LayoutNodeTemplate> = z.lazy(() => z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  styleRef: z.string().optional(),
  styles: styleSchema.optional(),
  children: z.array(layoutNodeSchema).optional(),
}).strict());

const layoutPresetSchema: z.ZodType<LayoutPreset> = z.object({
  id: z.enum(layoutIds),
  label: z.string().min(1),
  description: z.string(),
  initialSelection: z.string().min(1),
  styleTokens: z.record(z.string(), styleSchema).optional(),
  root: layoutNodeSchema,
}).strict();

export const layoutPresets = z.array(layoutPresetSchema).parse(presetData);
