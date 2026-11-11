import clsx from "clsx";
import type { LayerType } from "../../lib/page-model";
import { Icon, type IconName } from "../icons/Icon";
import { blockOptions } from "./layer-config";
import { layoutPresets, type LayoutId } from "./layouts/layout-registry";
import { insertPresets, type InsertPresetId } from "./insert-presets";

type InsertAction =
  | { kind: "layout"; id: LayoutId }
  | { kind: "component"; type: LayerType }
  | { kind: "preset"; id: InsertPresetId };

type InsertEntry = {
  id: string;
  label: string;
  category: string;
  description: string;
  icon: IconName;
  action: InsertAction;
};

type InsertPanelProps = {
  canEdit: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onLoadDemo: () => void;
  onAdd: (type: LayerType) => void;
  onAddInsertPreset: (preset: InsertPresetId) => void;
  onAddLayout: (layout: LayoutId) => void;
};

export function InsertPanel({
  canEdit,
  search,
  onSearchChange,
  onLoadDemo,
  onAdd,
  onAddInsertPreset,
  onAddLayout,
}: InsertPanelProps) {
  const searchTerm = search.trim().toLowerCase();
  const entries: InsertEntry[] = [
    ...layoutPresets.map((layout) => ({
      id: layout.id,
      label: layout.label,
      category: "Layouts",
      description: layout.description,
      icon: "grid" as const,
      action: { kind: "layout" as const, id: layout.id },
    })),
    ...blockOptions.map(({ type, insertLabel, description, category, icon }) => ({
      id: type,
      label: insertLabel,
      category,
      description,
      icon,
      action: { kind: "component" as const, type },
    })),
    ...insertPresets.map((preset) => ({
      id: preset.id,
      label: preset.label,
      category: preset.category,
      description: preset.description,
      icon: preset.icon as IconName,
      action: { kind: "preset" as const, id: preset.id },
    })),
  ];
  const groups = [...new Set(entries.map(({ category }) => category))].map((category) => ({
    category,
    entries: entries.filter((entry) => entry.category === category &&
      `${entry.label} ${entry.description} ${entry.action.kind === "component" ? entry.action.type : ""}`
        .toLowerCase()
        .includes(searchTerm),
    ),
  })).filter(({ entries: matching }) => matching.length > 0);
  const addEntry = (entry: InsertEntry) => {
    if (entry.action.kind === "layout") onAddLayout(entry.action.id);
    else if (entry.action.kind === "component") onAdd(entry.action.type);
    else onAddInsertPreset(entry.action.id);
  };

  return (
    <div className="blocks-content space-y-4 px-3.25 py-4">
      <div className="searchbox insert-searchbox">
        <Icon name="search" size={15} />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search layouts and sections..." />
      </div>

      {groups.map(({ category, entries: groupEntries }) => (
        <section className="insert-group" key={category}>
          <div className="insert-section-heading mb-2 text-[10px] font-bold uppercase tracking-[.08em] text-(--text-muted)">{category}</div>
          <div className={clsx("grid gap-2", category === "Layouts" ? "grid-cols-1" : "grid-cols-2")}>
            {groupEntries.map((entry) => (
              <button
                className={clsx(
                  entry.action.kind === "layout" ? "layout-card" : "block-card",
                  "transition duration-150 hover:-translate-y-0.5 motion-safe:animate-fade-in",
                )}
                key={entry.id}
                disabled={!canEdit}
                onClick={() => addEntry(entry)}
              >
                {entry.action.kind === "layout"
                  ? <span className={`layout-preview ${entry.id}`} aria-hidden="true"><i /><i /><i /><i /></span>
                  : <span className={`block-icon ${entry.action.kind === "component" ? entry.action.type : ""}`}><Icon name={entry.icon} size={19} /></span>}
                <span className={entry.action.kind === "layout" ? "layout-card-copy" : undefined}>
                  {entry.action.kind === "layout" ? <><b>{entry.label}</b><small>{entry.description}</small></> : entry.label}
                </span>
                <Icon name="plus" size={13} />
              </button>
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && <div className="block-note">No matching insert items.</div>}
      <div className="block-intro insert-demo-action">
        Load the sample page to explore the editor.
        <button className="demo-site-button" disabled={!canEdit} onClick={onLoadDemo}>Load Zephyr AI demo</button>
      </div>
      <div className="block-note">Choose a content area on the canvas to add components inside it.</div>
    </div>
  );
}
