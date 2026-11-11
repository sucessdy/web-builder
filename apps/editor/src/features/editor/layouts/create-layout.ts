import type { EditorLayer } from "../../../lib/page-model";
import { layoutPresets, type LayoutId, type LayoutNodeTemplate } from "./layout-registry";

export function createLayout(layoutId: LayoutId, instanceId: string): { layer: EditorLayer; selectedId: string } {
  const preset = layoutPresets.find(({ id }) => id === layoutId);
  if (!preset) throw new Error(`Unknown layout preset: ${layoutId}`);

  const makeId = (key: string) => key === "root" ? instanceId : `${instanceId}-${key}`;
  const materialize = (template: LayoutNodeTemplate): EditorLayer => {
    const token = template.styleRef ? preset.styleTokens?.[template.styleRef] : undefined;
    if (template.styleRef && !token) throw new Error(`Missing style token: ${template.styleRef}`);
    return {
      id: makeId(template.key),
      type: "section",
      name: template.name,
      text: "",
      visible: true,
      styles: { ...token, ...template.styles },
      children: (template.children ?? []).map(materialize),
    };
  };
  const findKey = (node: LayoutNodeTemplate, key: string): LayoutNodeTemplate | undefined =>
    node.key === key ? node : node.children?.map((child) => findKey(child, key)).find(Boolean);

  if (!findKey(preset.root, preset.initialSelection)) {
    throw new Error(`Initial selection “${preset.initialSelection}” is missing from ${preset.id}.`);
  }

  return {
    layer: materialize(preset.root),
    selectedId: makeId(preset.initialSelection),
  };
}
