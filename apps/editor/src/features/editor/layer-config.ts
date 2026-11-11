import {
  componentRegistry,
  type ComponentType,
} from "@visual-builder/component-registry";
import type { LayerType } from "../../lib/page-model";
import type { IconName } from "../icons/Icon";

const registryTypeByLayer: Record<LayerType, ComponentType> = {
  section: "container",
  heading: "heading",
  text: "text",
  button: "button",
  image: "image",
};

export const layerConfig = Object.fromEntries(
  Object.entries(registryTypeByLayer).map(([layerType, componentType]) => {
    const definition = componentRegistry[componentType];
    return [layerType, {
      label: definition.label,
      insertLabel: definition.insertLabel,
      description: definition.description,
      category: definition.category,
      defaultText: definition.defaultText,
      icon: definition.icon as IconName,
      styles: definition.defaultStyles,
    }];
  }),
) as Record<LayerType, {
  label: string;
  insertLabel: string;
  description: string;
  category: string;
  defaultText: string;
  icon: IconName;
  styles: (typeof componentRegistry)[ComponentType]["defaultStyles"];
}>;

export const blockOptions = Object.entries(layerConfig).map(([type, config]) => ({
  type: type as LayerType,
  ...config,
}));
