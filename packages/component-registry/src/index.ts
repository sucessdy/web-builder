
import { z } from "zod";
import { componentTypeSchema, styleSchema, type PageNode } from "@visual-builder/document-schema";
import componentDefinitions from "./components.json";

export type ComponentType = PageNode["type"];

const containerPropsSchema = z.object({}).strict();

const headingPropsSchema = z
  .object({
    text: z.string(),
    level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
  })
  .strict();

const textPropsSchema = z
  .object({
    text: z.string(),
  })
  .strict();

const buttonPropsSchema = z
  .object({
    label: z.string(),
    href: z.string(),
    variant: z.enum(["primary", "secondary", "outline"]),
  })
  .strict();

const imagePropsSchema = z
  .object({
    src: z.string(),
    alt: z.string(),
    objectFit: z.enum(["cover", "contain", "fill"]).optional(),
  })
  .strict();

export const componentPropsSchemas = {
  container: containerPropsSchema,
  heading: headingPropsSchema,
  text: textPropsSchema,
  button: buttonPropsSchema,
  image: imagePropsSchema,
} satisfies Record<ComponentType, z.ZodType>;

const componentDefinitionSchema = z.object({
  label: z.string().min(1),
  insertLabel: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  icon: z.string().min(1),
  defaultText: z.string(),
  defaultProps: z.record(z.string(), z.unknown()),
  defaultStyles: styleSchema,
  editableProps: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    control: z.enum(["text", "textarea", "select"]),
  }).strict()),
}).strict();

const componentDefinitionsSchema = z.record(componentTypeSchema, componentDefinitionSchema);

export const componentRegistry = componentDefinitionsSchema.parse(componentDefinitions);

for (const [type, definition] of Object.entries(componentRegistry) as [ComponentType, (typeof componentRegistry)[ComponentType]][]) {
  const result = componentPropsSchemas[type].safeParse(definition.defaultProps);
  if (!result.success) {
    throw new Error(`Invalid default properties for ${type}: ${result.error.message}`);
  }
}

export function getComponentDefinition(type: ComponentType) {
  return componentRegistry[type];
}

export function validateComponentProps(
  type: ComponentType,
  props: unknown,
) {
  return componentPropsSchemas[type].safeParse(props);
}

export function createDefaultNode(
  type: ComponentType,
  id: string,
): PageNode {
  return {
    id,
    type,
    props: { ...componentRegistry[type].defaultProps },
    styles: {},
    children: [],
  };
}
