import type { PageDocument } from "@visual-builder/document-schema";

export type ExportTarget = "react" | "next";

export function buildPageSource(
  page: PageDocument,
  target: ExportTarget,
): string {
  const fileHint = target === "next" ? "app/page.tsx" : "src/Page.tsx";
  const serializedPage = JSON.stringify(page, null, 2);

  return `// Generated website page: ${fileHint}
// Uses React server rendering and can be used in a React app or Next.js App Router.
import React, { type CSSProperties, type ReactNode } from "react";

type PageNode = {
  id: string;
  type: "container" | "heading" | "text" | "button" | "image";
  visible?: boolean;
  props: Record<string, unknown>;
  styles: CSSProperties;
  children: PageNode[];
};

const page: { root: PageNode } = ${serializedPage};
const stringValue = (value: unknown) => typeof value === "string" ? value : "";
const pageStyles = \`
  .generated-site { min-height: 100vh; color: #20231f; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .generated-site *, .generated-site *::before, .generated-site *::after { box-sizing: border-box; }
  .generated-site img { display: block; max-width: 100%; height: auto; }
  .generated-site a { color: inherit; }
  .generated-site [data-node-type="container"] { max-width: 1200px; margin-inline: auto; }
  @media (max-width: 700px) { .generated-site { padding-inline: 20px; } }
\`;

function PageNodeView({ node }: { node: PageNode }): ReactNode {
  if (node.visible === false) return null;
  const props = node.props ?? {};
  const children = node.children?.map((child) => <PageNodeView key={child.id} node={child} />);
  const common = { style: node.styles, "data-node-id": node.id, "data-node-type": node.type };

  switch (node.type) {
    case "container":
      return <div {...common}>{children}</div>;
    case "heading": {
      const requested = stringValue(props.level);
      const level = (["h1", "h2", "h3", "h4", "h5", "h6"].includes(requested) ? requested : "h1") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return React.createElement(level, common, stringValue(props.text), children);
    }
    case "text":
      return <p {...common}>{stringValue(props.text)}{children}</p>;
    case "button":
      return <a {...common} href={stringValue(props.href) || "#"} className={\`page-button page-button--\${stringValue(props.variant) || "primary"}\`}>{stringValue(props.label)}{children}</a>;
    case "image":
      return <img {...common} src={stringValue(props.src)} alt={stringValue(props.alt)} style={{ ...node.styles, objectFit: stringValue(props.objectFit) as CSSProperties["objectFit"] }} />;
    default:
      return null;
  }
}

export default function GeneratedWebsitePage() {
  return <><style>{pageStyles}</style><main className="generated-site"><PageNodeView node={page.root} /></main></>;
}
`;
}
