import type {
  NodeStyles,
  PageDocument,
  PageNode,
} from "@visual-builder/document-schema";
import { pageTemplate } from "../../lib/page-model";

export type CanvasItem = {
  id: string;
  name?: string;
  type: "section" | "heading" | "text" | "button" | "image";
  text: string;
  visible: boolean;
  color?: string;
  fontSize?: number;
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  styles?: NodeStyles;
  children?: CanvasItem[];
};

const DEFAULT_PAGE_ID = "home-page";
const DEFAULT_ROOT_ID = "root";

const DEFAULT_IMAGE_SRC =
  "https://placehold.co/900x420?text=Add+your+image";

export function createCanvasDocument(
  items: CanvasItem[],
): PageDocument {
  return {
    schemaVersion: 1,
    id: DEFAULT_PAGE_ID,
    metadata: {
      title: "Home page",
    },
    root: {
      id: DEFAULT_ROOT_ID,
      type: "container",
      props: {},
      styles: pageTemplate.root.styles,
      children: items.map(createNode),
    },
  };
}

function createNode(item: CanvasItem): PageNode {
  const common = {
    id: item.id,
    ...(item.name ? { name: item.name } : {}),
    visible: item.visible,
  };

  const styles = createNodeStyles(item);

  switch (item.type) {
    case "section":
      return {
        ...common,
        type: "container",
        props: {},
        styles,
        children: item.children?.length ? item.children.map(createNode) : [
          {
            id: `${item.id}__text`,
            type: "text",
            props: {
              text: item.text,
            },
            styles: {},
            children: [],
          },
        ],
      };

    case "heading":
      return {
        ...common,
        type: "heading",
        props: {
          text: item.text,
          level: item.level ?? "h1",
        },
        styles,
        children: item.children?.map(createNode) ?? [],
      };

    case "text":
      return {
        ...common,
        type: "text",
        props: {
          text: item.text,
        },
        styles,
        children: item.children?.map(createNode) ?? [],
      };

    case "button":
      return {
        ...common,
        type: "button",
        props: {
          label: item.text,
          href: item.href ?? "#",
          variant: item.variant ?? "primary",
        },
        styles,
        children: item.children?.map(createNode) ?? [],
      };

    case "image":
      return {
        ...common,
        type: "image",
        props: {
          src: item.src || DEFAULT_IMAGE_SRC,
          alt: item.text,
          objectFit: "cover",
        },
        styles,
        children: item.children?.map(createNode) ?? [],
      };
  }
}

function createNodeStyles(item: CanvasItem): NodeStyles {
  return {
    ...item.styles,
    ...(item.color !== undefined
      ? { color: item.color }
      : {}),
    ...(item.fontSize !== undefined
      ? { fontSize: `${item.fontSize}px` }
      : {}),
  };
}
