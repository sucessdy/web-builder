import type { LayerType } from "../../lib/page-model";
import { Icon, type IconName } from "../icons/Icon";
import { blockOptions, layoutOptions, type LayoutOption } from "./layer-config";

type InsertPanelProps = {
  canEdit: boolean;
  search: string;
  iconFor: (type: LayerType) => IconName;
  onSearchChange: (search: string) => void;
  onLoadDemo: () => void;
  onAdd: (type: LayerType) => void;
  onAddInsertPreset: (preset: "text-link" | "blockquote") => void;
  onAddLayout: (layout: LayoutOption["id"]) => void;
};

export function InsertPanel({
  canEdit,
  search,
  iconFor,
  onSearchChange,
  onLoadDemo,
  onAdd,
  onAddInsertPreset,
  onAddLayout,
}: InsertPanelProps) {
  const searchTerm = search.trim().toLowerCase();
  const matches = (labels: string[]) => labels.some((label) => label.includes(searchTerm));
  const elementOptions = blockOptions.filter(({ type, label }) =>
    ["section", "image", "button"].includes(type) && label.toLowerCase().includes(searchTerm),
  );

  return (
    <div className="blocks-content">
      <div className="searchbox insert-searchbox">
        <Icon name="search" size={15} />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search layouts and sections..." />
      </div>

      <div className="insert-section-heading">Layouts</div>
      <div className="insert-layout-list">
        {layoutOptions
          .filter((layout) => `${layout.label} ${layout.description}`.toLowerCase().includes(searchTerm))
          .map((layout) => <LayoutCard key={layout.id} layout={layout} disabled={!canEdit} onClick={() => onAddLayout(layout.id)} />)}
      </div>

      <div className="insert-section-heading components-heading">Typography</div>
      <div className="block-grid">
        {matches(["heading", "h1"]) && <button className="block-card" disabled={!canEdit} onClick={() => onAdd("heading")}><span className="block-icon heading">H1</span><span>Heading</span><Icon name="plus" size={13} /></button>}
        {matches(["paragraph", "text", "p"]) && <button className="block-card" disabled={!canEdit} onClick={() => onAdd("text")}><span className="block-icon text"><Icon name="text" size={19} /></span><span>Paragraph</span><Icon name="plus" size={13} /></button>}
        {matches(["text link", "link"]) && <button className="block-card" disabled={!canEdit} onClick={() => onAddInsertPreset("text-link")}><span className="block-icon button">↗</span><span>Text Link</span><Icon name="plus" size={13} /></button>}
        {matches(["blockquote"]) && <button className="block-card" disabled={!canEdit} onClick={() => onAddInsertPreset("blockquote")}><span className="block-icon text">“ ”</span><span>Blockquote</span><Icon name="plus" size={13} /></button>}
      </div>

      <div className="insert-section-heading components-heading">Elements</div>
      <div className="block-intro">
        Add an image or reusable section to your page or selected content area.
        <button className="demo-site-button" disabled={!canEdit} onClick={onLoadDemo}>Load Zephyr AI demo</button>
      </div>
      <div className="block-grid">
        {elementOptions.map(({ type, label }) => (
          <button className="block-card" key={type} disabled={!canEdit} onClick={() => onAdd(type)}>
            <span className={`block-icon ${type}`}><Icon name={iconFor(type)} size={19} /></span>
            <span>{label}</span><Icon name="plus" size={13} />
          </button>
        ))}
      </div>
      <div className="block-note">Choose a content area on the canvas to add components inside it.</div>
    </div>
  );
}

function LayoutCard({ layout, disabled, onClick }: { layout: LayoutOption; disabled: boolean; onClick: () => void }) {
  return (
    <button className="layout-card" disabled={disabled} onClick={onClick}>
      <span className={`layout-preview ${layout.id}`} aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="layout-card-copy"><b>{layout.label}</b><small>{layout.description}</small></span>
      <Icon name="plus" size={14} />
    </button>
  );
}
