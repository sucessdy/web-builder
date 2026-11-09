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
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  styles?: NodeStyles;
  children?: EditorLayer[];
};

export const pageTemplate = pageDocumentSchema.parse(pageTemplateJson);

export function pageToLayers(page: PageDocument): EditorLayer[] {
  return page.root.children.map(nodeToLayer);
}

function nodeToLayer(node: PageNode): EditorLayer {
    const props = node.type === "container" ? node.children.find((child) => child.type === "text")?.props ?? {} : node.props;
    const fontSize = Number.parseFloat(node.styles.fontSize ?? "");
    const shared = {
      id: node.id,
      name: node.name ?? node.id,
      visible: node.visible ?? true,
      styles: node.styles,
      color: node.styles.color,
      fontSize: Number.isNaN(fontSize) ? undefined : fontSize,
      children: node.children.map(nodeToLayer),
    };

    switch (node.type) {
      case "container":
        return { ...shared, type: "section", text: String(props.text ?? "") };
      case "heading": {
        const level = props.level;
        return {
          ...shared,
          type: "heading",
          text: String(props.text ?? ""),
          level: typeof level === "string" && /^h[1-6]$/.test(level) ? level as EditorLayer["level"] : "h1",
        };
      }
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
        styles,
        children: layer.children !== undefined ? layer.children.map(layerToPageNode) : [{
          id: `${layer.id}__text`,
          type: "text",
          name: `${layer.name} content`,
          props: { text: layer.text },
          styles: {},
          children: [],
        }],
      };
    case "heading":
      return { ...common, type: "heading", props: { text: layer.text, level: layer.level ?? "h1" }, styles, children: layer.children?.map(layerToPageNode) ?? [] };
    case "button":
      return {
        ...common,
        type: "button",
        props: { label: layer.text, href: layer.href ?? "#", variant: layer.variant ?? "primary" },
        styles,
        children: layer.children?.map(layerToPageNode) ?? [],
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
        children: layer.children?.map(layerToPageNode) ?? [],
      };
    case "text":
      return { ...common, type: "text", props: { text: layer.text }, styles, children: layer.children?.map(layerToPageNode) ?? [] };
  }
}

export function findLayer(layers: EditorLayer[], id: string): EditorLayer | undefined {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    const found = layer.children && findLayer(layer.children, id);
    if (found) return found;
  }
  return undefined;
}

export function findParentLayer(layers: EditorLayer[], id: string): EditorLayer | undefined {
  for (const layer of layers) {
    if (layer.children?.some((child) => child.id === id)) return layer;
    const parent = layer.children && findParentLayer(layer.children, id);
    if (parent) return parent;
  }
  return undefined;
}

export function updateLayerTree(
  layers: EditorLayer[],
  id: string,
  updater: (layer: EditorLayer) => EditorLayer,
): EditorLayer[] {
  return layers.map((layer) => {
    if (layer.id === id) return updater(layer);
    return layer.children ? { ...layer, children: updateLayerTree(layer.children, id, updater) } : layer;
  });
}

export function removeLayerTree(layers: EditorLayer[], id: string): EditorLayer[] {
  return layers
    .filter((layer) => layer.id !== id)
    .map((layer) => layer.children ? { ...layer, children: removeLayerTree(layer.children, id) } : layer);
}

export function flattenLayers(layers: EditorLayer[], depth = 0): Array<{ item: EditorLayer; depth: number }> {
  return layers.flatMap((item) => [
    { item, depth },
    ...(item.children ? flattenLayers(item.children, depth + 1) : []),
  ]);
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
