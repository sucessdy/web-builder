import type { NodeStyles, PageDocument, PageNode } from "@visual-builder/document-schema";

export type CanvasItem = {
  id: string;
  name?: string;
  type: "section" | "heading" | "text" | "button" | "image";
  text: string;
  visible: boolean;
  color?: string;
  fontSize?: number;
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  styles?: NodeStyles;
};

export function createCanvasDocument(items: CanvasItem[]): PageDocument {
  return {
    schemaVersion: 1,
    id: "home-page",
    metadata: { title: "Home page" },
    root: {
      id: "root",
      type: "container",
      props: {},
      styles: {},
      children: items.filter((item) => item.visible).map(createNode),
    },
  };
}

function createNode(item: CanvasItem): PageNode {
  const common = {
    id: item.id,
    ...(item.name ? { name: item.name } : {}),
    visible: item.visible,
  };
  const styles = {
    ...item.styles,
    ...(item.color ? { color: item.color } : {}),
    ...(item.fontSize ? { fontSize: `${item.fontSize}px` } : {}),
  };

  switch (item.type) {
    case "section":
      return {
        ...common,
        type: "container",
        props: {},
        styles: {},
        children: [{
          id: `${item.id}__text`,
          type: "text",
          props: { text: item.text },
          styles: {},
          children: [],
        }],
      };
    case "heading":
      return {
        ...common,
        type: "heading",
        props: { text: item.text, level: "h1" },
        styles,
        children: [],
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
        children: [],
      };
    case "image":
      return {
        ...common,
        type: "image",
        props: {
          src: item.src ?? "https://placehold.co/900x420?text=Add+your+image",
          alt: item.text,
          objectFit: "cover",
        },
        styles,
        children: [],
      };
    case "text":
      return {
        ...common,
        type: "text",
        props: { text: item.text },
        styles,
        children: [],
      };
  }
}
