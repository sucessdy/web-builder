import type { EditorLayer, LayerType } from "../../lib/page-model";
import type { NodeStyles } from "@visual-builder/document-schema";
import type { IconName } from "../icons/Icon";

export const layerConfig: Record<LayerType, {
  label: string;
  defaultText: string;
  icon: IconName;
  styles: NodeStyles;
}> = {
  section: {
    label: "Section", defaultText: "New section", icon: "grid",
    styles: { width: "100%", minHeight: "42px", padding: "12px", color: "#aaa99f", backgroundColor: "#f1f0ea", borderWidth: "1px", borderStyle: "dashed", borderColor: "#d6d4ca" },
  },
  heading: {
    label: "Heading", defaultText: "A fresh idea.", icon: "type",
    styles: { margin: "25px 0 8px", color: "#272923", fontFamily: "Manrope", fontSize: "27px", fontWeight: 500, lineHeight: 1.2, letterSpacing: "-1px" },
  },
  text: {
    label: "Text block", defaultText: "Write something meaningful here.", icon: "text",
    styles: { maxWidth: "340px", margin: "8px 0", color: "#686a62", fontSize: "12px", lineHeight: 1.6 },
  },
  button: {
    label: "Button", defaultText: "Learn more", icon: "cursor",
    styles: { display: "inline-flex", alignItems: "center", gap: "8px", margin: "12px 0", padding: "11px 15px", color: "#ffffff", backgroundColor: "#d87553", borderRadius: "3px", fontSize: "12px", fontWeight: 600, textDecoration: "none" },
  },
  image: {
    label: "Image", defaultText: "Your image", icon: "image",
    styles: { display: "block", width: "100%", maxWidth: "340px", minHeight: "110px", margin: "12px 0", borderRadius: "4px" },
  },
};

export const blockOptions = Object.entries(layerConfig).map(([type, config]) => ({
  type: type as LayerType,
  ...config,
}));

export type LayoutOption = {
  id: "two-columns" | "quick-stack" | "quick-grid";
  label: string;
  description: string;
};

export const layoutOptions: LayoutOption[] = [
  { id: "two-columns", label: "Two columns", description: "Side-by-side content" },
  { id: "quick-stack", label: "Quick Stack", description: "One large area, two stacked" },
  { id: "quick-grid", label: "Quick Grid", description: "Four equal content areas" },
];

export function createLayout(optionId: LayoutOption["id"], id: string): { layer: EditorLayer; selectedId: string } {
  const option = layoutOptions.find(({ id: candidate }) => candidate === optionId);
  if (!option) throw new Error(`Unknown layout: ${optionId}`);

  const areaStyles: NodeStyles = {
    minHeight: "180px",
    padding: "24px",
    border: "1px dashed #c8cad1",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
  };
  const area = (areaId: string, name: string): EditorLayer => ({
    id: areaId,
    type: "section",
    name,
    text: "",
    visible: true,
    styles: areaStyles,
    children: [],
  });

  let children: EditorLayer[];
  let selectedId: string;
  if (optionId === "quick-stack") {
    selectedId = `${id}-main`;
    children = [
      area(`${id}-main`, "Main content area"),
      {
        id: `${id}-stack`,
        type: "section",
        name: "Stacked content",
        text: "",
        visible: true,
        styles: { display: "grid", gridTemplateRows: "repeat(2, minmax(120px, 1fr))", gap: "16px" },
        children: [area(`${id}-top`, "Top content area"), area(`${id}-bottom`, "Bottom content area")],
      },
    ];
  } else {
    const count = optionId === "quick-grid" ? 4 : 2;
    children = Array.from({ length: count }, (_, index) => area(
      `${id}-${index + 1}`,
      optionId === "quick-grid" ? `Grid area ${index + 1}` : `${index === 0 ? "Left" : "Right"} content area`,
    ));
    selectedId = `${id}-1`;
  }

  return {
    layer: {
      id,
      type: "section",
      name: option.label,
      text: "",
      visible: true,
      styles: {
        display: "grid",
        gridTemplateColumns: optionId === "quick-stack" ? "minmax(0, 1.5fr) minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
        alignItems: "stretch",
        gap: "24px",
        width: "100%",
        padding: "32px 6%",
      },
      children,
    },
    selectedId,
  };
}
