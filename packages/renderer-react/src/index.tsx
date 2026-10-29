import type { CSSProperties, ReactNode } from "react";
import {
  pageDocumentSchema,
  type PageNode,
} from "@visual-builder/document-schema";
import {
  getComponentDefinition,
  validateComponentProps,
} from "@visual-builder/component-registry";

export type PageRendererProps = {
  /** A JSON value is accepted so documents from files or APIs are checked at runtime. */
  document: unknown;
  className?: string;
  onNodeClick?: (node: PageNode) => void;
  selectedNodeId?: string;
};

/** Validate and render a JSON page document using the registered component types. */
export function PageRenderer({
  document,
  className,
  onNodeClick,
  selectedNodeId,
}: PageRendererProps) {
  const result = pageDocumentSchema.safeParse(document);
  if (!result.success) {
    throw new Error(`Invalid page document: ${result.error.message}`);
  }

  return (
    <div className={className} data-page-id={result.data.id}>
      <NodeRenderer
        node={result.data.root}
        onNodeClick={onNodeClick}
        selectedNodeId={selectedNodeId}
      />
    </div>
  );
}

export type NodeRendererProps = {
  node: PageNode;
  onNodeClick?: (node: PageNode) => void;
  selectedNodeId?: string;
};

type RenderProps = {
  container: Record<string, never>;
  heading: { text: string; level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" };
  text: { text: string };
  button: { label: string; href: string; variant: "primary" | "secondary" | "outline" };
  image: { src: string; alt: string; objectFit?: "cover" | "contain" | "fill" };
};

/** Render one node and all its descendants. Exported for canvas-level composition. */
export function NodeRenderer({ node, onNodeClick, selectedNodeId }: NodeRendererProps) {
  if (node.visible === false) return null;

  const definition = getComponentDefinition(node.type);
  const propsResult = validateComponentProps(node.type, node.props);
  if (!propsResult.success) throwInvalidProps(definition.label, node.id, propsResult.error.message);

  const children = node.children.map((child) => (
    <NodeRenderer
      key={child.id}
      node={child}
      onNodeClick={onNodeClick}
      selectedNodeId={selectedNodeId}
    />
  ));
  const commonProps = {
    "data-node-id": node.id,
    "data-node-type": node.type,
    "data-selected": node.id === selectedNodeId ? "true" : undefined,
    style: node.styles as CSSProperties,
    onClick: onNodeClick ? () => onNodeClick(node) : undefined,
  };

  switch (node.type) {
    case "container":
      return <div {...commonProps}>{children}</div>;
    case "heading": {
      const props = node.props as RenderProps["heading"];
      return (
        <HeadingElement
          {...commonProps}
          level={props.level}
          text={props.text}
          children={children}
        />
      );
    }
    case "text": {
      const props = node.props as RenderProps["text"];
      return (
        <p {...commonProps}>
          {props.text}
          {children}
        </p>
      );
    }
    case "button": {
      const props = node.props as RenderProps["button"];
      return (
        <a
          {...commonProps}
          href={props.href}
          className={`page-button page-button--${props.variant}`}
        >
          {props.label}
          {children}
        </a>
      );
    }
    case "image": {
      const props = node.props as RenderProps["image"];
      return (
        <>
          <img
            {...commonProps}
            src={props.src}
            alt={props.alt}
            style={{ ...node.styles, objectFit: props.objectFit } as CSSProperties}
          />
          {children}
        </>
      );
    }
  }
}

function throwInvalidProps(label: string, nodeId: string, message: string): never {
  throw new Error(`Invalid props for ${label} node "${nodeId}": ${message}`);
}

type HeadingElementProps = {
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  text: string;
  children: ReactNode;
  "data-node-id": string;
  style: CSSProperties;
  onClick?: () => void;
};

function HeadingElement({ level, text, children, ...props }: HeadingElementProps) {
  switch (level) {
    case "h1":
      return <h1 {...props}>{text}{children}</h1>;
    case "h2":
      return <h2 {...props}>{text}{children}</h2>;
    case "h3":
      return <h3 {...props}>{text}{children}</h3>;
    case "h4":
      return <h4 {...props}>{text}{children}</h4>;
    case "h5":
      return <h5 {...props}>{text}{children}</h5>;
    case "h6":
      return <h6 {...props}>{text}{children}</h6>;
  }
}
