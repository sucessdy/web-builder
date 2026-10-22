
import { z } from "zod";
import { styleSchema } from "./style.schema";

export const componentTypeSchema = z.enum([
  "container",
  "heading",
  "text",
  "button",
  "image",
]);

export const pageNodeSchema: z.ZodType<PageNode> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1),
      type: componentTypeSchema,
      props: z.record(z.string(), z.unknown()),
      styles: styleSchema,
      children: z.array(pageNodeSchema),
    })
    .strict(),
);

export interface PageNode {
  id: string;
  type: "container" | "heading" | "text" | "button" | "image";
  props: Record<string, unknown>;
  styles: NodeStyles;
  children: PageNode[];
}

type NodeStyles = z.infer<typeof styleSchema>;
