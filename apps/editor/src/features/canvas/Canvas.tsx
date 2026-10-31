import {
  createElement,
  useMemo,
  type CSSProperties,
  type MouseEvent,
} from "react";

import type {
  PageNode,
} from "@visual-builder/document-schema";
import { createCanvasDocument, type CanvasItem } from "./canvas-document";

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
    <div className="rendered-page">
      <CanvasNode
        node={document.root}
        selectedId={selectedId}
        preview={preview}
        onSelect={onSelect}
      />
    </div>
  );
}

function CanvasNode({
  node,
  selectedId,
  preview,
  onSelect,
}: {
  node: PageNode;
  selectedId: string;
  preview: boolean;
  onSelect: (id: string) => void;
}) {
  if (node.visible === false) return null;

  const props = node.props;
  const children = node.children.map((child) => (
    <CanvasNode
      key={child.id}
      node={child}
      selectedId={selectedId}
      preview={preview}
      onSelect={onSelect}
    />
  ));
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (preview) return;
    event.stopPropagation();
    if (node.type === "button") event.preventDefault();

    // Section text belongs to its parent section.
    const id = node.id.endsWith("__text")
      ? node.id.slice(0, -"__text".length)
      : node.id;
    onSelect(id);
  };
  const common = {
    "data-node-id": node.id,
    "data-node-type": node.type,
    "data-selected": !preview && node.id === selectedId ? "true" : undefined,
    className: preview ? undefined : "selectable",
    style: node.styles as CSSProperties,
    onClick: handleClick,
  };

  switch (node.type) {
    case "container":
      return <div {...common}>{children}</div>;
    case "heading": {
      const requestedLevel = props.level;
      const level =
        typeof requestedLevel === "string" && /^h[1-6]$/.test(requestedLevel)
          ? requestedLevel
          : "h1";
      return createElement(level, common, String(props.text ?? ""), children);
    }
    case "text":
      return <p {...common}>{String(props.text ?? "")}{children}</p>;
    case "button":
      return (
        <a {...common} href={String(props.href ?? "#")}>
          {String(props.label ?? "")}{children}
        </a>
      );
    case "image":
      return (
        <img
          {...common}
          src={String(props.src ?? "")}
          alt={String(props.alt ?? "")}
          style={
            {
              ...node.styles,
              objectFit: String(props.objectFit ?? "cover"),
            } as CSSProperties
          }
        />
      );
  }
}
