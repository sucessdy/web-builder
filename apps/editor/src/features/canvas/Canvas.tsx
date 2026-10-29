import { useMemo } from "react";
import { PageRenderer } from "@visual-builder/renderer-react";
import type {
  PageDocument,
  PageNode,
} from "@visual-builder/document-schema";

export type CanvasItem = {
  id: string;
  type: "section" | "heading" | "text" | "button" | "image";
  text: string;
  visible: boolean;
  color?: string;
  fontSize?: number;
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
};

type CanvasProps = {
  items: CanvasItem[];
  selectedId: string;
  preview: boolean;
  onSelect: (id: string) => void;
};

export function Canvas({
  items,
  selectedId,
  preview,
  onSelect,
}: CanvasProps) {
  const document = useMemo(
    () => createCanvasDocument(items),
    [items],
  );

  return (
    <PageRenderer
      document={document}
      className="rendered-page"
      selectedNodeId={preview ? undefined : selectedId}
      onNodeClick={(node) => {
        if (preview) return;

        // Section text belongs to its parent section.
        const selectedNodeId = node.id.endsWith("__text")
          ? node.id.slice(0, -"__text".length)
          : node.id;

        onSelect(selectedNodeId);
      }}
    />
  );
}

export function createCanvasDocument(
  items: CanvasItem[],
): PageDocument {
  return {
    schemaVersion: 1,
    id: "home-page",
    metadata: {
      title: "Home page",
    },
    root: {
      id: "root",
      type: "container",
      props: {},
      styles: {},
      children: items
        .filter((item) => item.visible)
        .map(createNode),
    },
  };
}

function createNode(item: CanvasItem): PageNode {
  const styles = {
    ...(item.color ? { color: item.color } : {}),
    ...(item.fontSize
      ? { fontSize: `${item.fontSize}px` }
      : {}),
  };

  switch (item.type) {
    case "section":
      return {
        id: item.id,
        type: "container",
        props: {},
        styles: {},
        children: [
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
        id: item.id,
        type: "heading",
        props: {
          text: item.text,
          level: "h1",
        },
        styles,
        children: [],
      };

    case "button":
      return {
        id: item.id,
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
        id: item.id,
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
        id: item.id,
        type: "text",
        props: {
          text: item.text,
        },
        styles,
        children: [],
      };
  }
}
