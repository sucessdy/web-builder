
import { z } from "zod";
import type { PageNode } from "@visual-builder/document-schema";

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

export const componentRegistry = {
  container: {
    label: "Container",
    category: "Layout",
    defaultProps: {},
    editableProps: [],
  },
  heading: {
    label: "Heading",
    category: "Typography",
    defaultProps: {
      text: "Your heading",
      level: "h1",
    },
    editableProps: [
      { name: "text", label: "Text", control: "text" },
      { name: "level", label: "Heading level", control: "select" },
    ],
  },
  text: {
    label: "Text",
    category: "Typography",
    defaultProps: {
      text: "Start writing your content here.",
    },
    editableProps: [
      { name: "text", label: "Text", control: "textarea" },
    ],
  },
  button: {
    label: "Button",
    category: "Actions",
    defaultProps: {
      label: "Click me",
      href: "#",
      variant: "primary",
    },
    editableProps: [
      { name: "label", label: "Button label", control: "text" },
      { name: "href", label: "Link", control: "text" },
      { name: "variant", label: "Style", control: "select" },
    ],
  },
  image: {
    label: "Image",
    category: "Media",
    defaultProps: {
      src: "https://placehold.co/600x400",
      alt: "Placeholder image",
      objectFit: "cover",
    },
    editableProps: [
      { name: "src", label: "Image URL", control: "text" },
      { name: "alt", label: "Alternative text", control: "text" },
      { name: "objectFit", label: "Fit", control: "select" },
    ],
  },
} as const satisfies Record<
  ComponentType,
  {
    label: string;
    category: string;
    defaultProps: Record<string, unknown>;
    editableProps: {
      name: string;
      label: string;
      control: "text" | "textarea" | "select";
    }[];
  }
>;

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
