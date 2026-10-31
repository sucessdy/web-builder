import {
  pageDocumentSchema,
  type NodeStyles,
  type PageDocument,
  type PageNode,
} from "@visual-builder/document-schema";
import pageTemplateJson from "../page.json";

export type LayerType = "section" | "heading" | "text" | "button" | "image";

export type EditorLayer = {
  id: string;
  type: LayerType;
  name: string;
  text: string;
  visible: boolean;
  color?: string;
  fontSize?: number;
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  styles?: NodeStyles;
};

export const pageTemplate = pageDocumentSchema.parse(pageTemplateJson);

export function pageToLayers(page: PageDocument): EditorLayer[] {
  return page.root.children.map((node) => {
    const contentNode = node.type === "container" ? node.children[0] : node;
    const props = contentNode?.props ?? node.props;
    const fontSize = Number.parseFloat(node.styles.fontSize ?? "");
    const shared = {
      id: node.id,
      name: node.name ?? node.id,
      visible: node.visible ?? true,
      styles: node.styles,
      color: node.styles.color,
      fontSize: Number.isNaN(fontSize) ? undefined : fontSize,
    };

    switch (node.type) {
      case "container":
        return { ...shared, type: "section", text: String(props.text ?? "") };
      case "heading":
        return { ...shared, type: "heading", text: String(props.text ?? "") };
      case "button": {
        const variant = props.variant;
        return {
          ...shared,
          type: "button",
          text: String(props.label ?? ""),
          href: String(props.href ?? "#"),
          variant: variant === "secondary" || variant === "outline" ? variant : "primary",
        };
      }
      case "image":
        return {
          ...shared,
          type: "image",
          text: String(props.alt ?? ""),
          src: String(props.src ?? ""),
        };
      case "text":
        return { ...shared, type: "text", text: String(props.text ?? "") };
    }
  });
}

export function layerToPageNode(layer: EditorLayer): PageNode {
  const styles = {
    ...layer.styles,
    ...(layer.color ? { color: layer.color } : {}),
    ...(layer.fontSize ? { fontSize: `${layer.fontSize}px` } : {}),
  };
  const common = { id: layer.id, name: layer.name, visible: layer.visible };

  switch (layer.type) {
    case "section":
      return {
        ...common,
        type: "container",
        props: {},
        styles: layer.styles ?? {},
        children: [{
          id: `${layer.id}__text`,
          type: "text",
          name: `${layer.name} content`,
          props: { text: layer.text },
          styles: {},
          children: [],
        }],
      };
    case "heading":
      return { ...common, type: "heading", props: { text: layer.text, level: "h1" }, styles, children: [] };
    case "button":
      return {
        ...common,
        type: "button",
        props: { label: layer.text, href: layer.href ?? "#", variant: layer.variant ?? "primary" },
        styles,
        children: [],
      };
    case "image":
      return {
        ...common,
        type: "image",
        props: {
          src: layer.src ?? "https://placehold.co/900x420?text=Add+your+image",
          alt: layer.text,
          objectFit: "cover",
        },
        styles,
        children: [],
      };
    case "text":
      return { ...common, type: "text", props: { text: layer.text }, styles, children: [] };
  }
}

export function layersToPage(layers: EditorLayer[]): PageDocument {
  return pageDocumentSchema.parse({
    ...pageTemplate,
    root: {
      ...pageTemplate.root,
      children: layers.map(layerToPageNode),
    },
  });
}

export function parseSavedLayers(serialized: string | null): EditorLayer[] | null {
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    const pageResult = pageDocumentSchema.safeParse(value);
    if (pageResult.success) return pageToLayers(pageResult.data);

    // Read the earlier editor format so existing browser saves keep working.
    if (
      Array.isArray(value) &&
      value.every((item) =>
        typeof item === "object" && item !== null &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.text === "string" &&
        typeof item.visible === "boolean" &&
        ["section", "heading", "text", "button", "image"].includes(item.type),
      )
    ) {
      return value as EditorLayer[];
    }
  } catch {
    return null;
  }

  return null;
}
