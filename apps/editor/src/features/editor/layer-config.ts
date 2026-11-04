import type { LayerType } from "../../lib/page-model";
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
