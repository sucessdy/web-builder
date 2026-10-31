import type { LayerType } from "../../lib/page-model";
import type { IconName } from "../icons/Icon";

export const layerConfig: Record<LayerType, {
  label: string;
  defaultText: string;
  icon: IconName;
}> = {
  section: { label: "Section", defaultText: "New section", icon: "grid" },
  heading: { label: "Heading", defaultText: "A fresh idea.", icon: "type" },
  text: { label: "Text block", defaultText: "Write something meaningful here.", icon: "text" },
  button: { label: "Button", defaultText: "Learn more", icon: "cursor" },
  image: { label: "Image", defaultText: "Your image", icon: "image" },
};

export const blockOptions = Object.entries(layerConfig).map(([type, config]) => ({
  type: type as LayerType,
  ...config,
}));
