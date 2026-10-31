import { useRef } from "react";
import type { AuthUser } from "../auth/context/auth-context";
import type { NodeStyles } from "@visual-builder/document-schema";
import type { EditorLayer, LayerType } from "../../lib/page-model";
import { Icon, type IconName } from "../icons/Icon";
import { blockOptions } from "./layer-config";

type IconComponent = typeof Icon;

type SidebarProps = {
  Icon: IconComponent;
  user: AuthUser;
  authEnabled: boolean;
  canEdit: boolean;
  canManageMembers: boolean;
  filteredItems: EditorLayer[];
  selectedId: string;
  tab: "layers" | "blocks";
  search: string;
  iconFor: (type: LayerType) => IconName;
  onTabChange: (tab: "layers" | "blocks") => void;
  onSearchChange: (search: string) => void;
  onSelect: (id: string) => void;
  onAdd: (type: LayerType) => void;
  onAssetSelect: (file: File) => void;
  onAiOpen: () => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onSwitchWorkspace: (id: string) => void;
  onOpenMembers: () => void;
};

export function EditorSidebar({
  Icon,
  user,
  authEnabled,
  canEdit,
  canManageMembers,
  filteredItems,
  selectedId,
  tab,
  search,
  iconFor,
  onTabChange,
  onSearchChange,
  onSelect,
  onAdd,
  onAssetSelect,
  onAiOpen,
  onToggleVisibility,
  onReorder,
  onSwitchWorkspace,
  onOpenMembers,
}: SidebarProps) {
  const assetInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <aside className="left-rail">
        <button className="rail-button active" title="Builder">
          <Icon name="grid" />
        </button>
        <button className="rail-button" title="Components" onClick={() => onTabChange("blocks")}>
          <Icon name="plus" />
        </button>
        <button className="rail-button ai-rail-button" title="Generate a website with AI" disabled={!canEdit} onClick={onAiOpen}>
          <Icon name="sparkles" />
        </button>
        <button className="rail-button" title="Add an image asset" disabled={!canEdit} onClick={() => assetInput.current?.click()}><Icon name="image" /></button>
        <input
          ref={assetInput}
          hidden
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAssetSelect(file);
            event.target.value = "";
          }}
        />
        <div className="rail-spacer" />
        <button className="rail-button" title="Settings are not available yet" disabled><Icon name="settings" /></button>
        <div className="rail-avatar">M</div>
      </aside>

      <aside className="left-panel">
        <div className="panel-title-row">
          <div>
            <div className="eyebrow-label">WEBSITE</div>
            <h1>Pages <span className="page-count">1</span></h1>
          </div>
          <button className="small-icon-button" title="This editor currently supports one page" disabled>
            <Icon name="plus" size={17} />
          </button>
        </div>
        <button className="page-row active">
          <span className="page-glyph">⌂</span><span>Home page</span>
          <span className="page-row-menu"><Icon name="more" size={16} /></span>
        </button>
        <div className="panel-tabs">
          <button className={tab === "layers" ? "selected" : ""} onClick={() => onTabChange("layers")}>
            <Icon name="layers" size={15} /> Layers
          </button>
          <button className={tab === "blocks" ? "selected" : ""} onClick={() => onTabChange("blocks")}>
            <Icon name="grid" size={15} /> Add blocks
          </button>
        </div>
        {tab === "layers" ? (
          <>
            <div className="searchbox">
              <Icon name="search" size={15} />
              <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Find a layer" />
              <kbd>⌘ K</kbd>
            </div>
            <div className="tree-heading">
              <span>HOME PAGE</span>
              <button className="plain-icon" disabled={!canEdit} onClick={() => onAdd("section")}>
                <Icon name="plus" size={15} />
              </button>
            </div>
            <div className="layer-list">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`layer-row ${selectedId === item.id ? "selected" : ""}`}
                  draggable={canEdit}
                  onClick={() => onSelect(item.id)}
                  onDragStart={(event) => event.dataTransfer.setData("text/layer-id", item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    onReorder(event.dataTransfer.getData("text/layer-id"), item.id);
                  }}
                >
                  <span className="layer-caret">{item.type === "section" ? "⌄" : ""}</span>
                  <Icon name={iconFor(item.type)} size={15} />
                  <span className="layer-name">{item.name}</span>
                  <span
                    className={`layer-more ${!canEdit ? "is-disabled" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (canEdit) onToggleVisibility(item.id);
                    }}
                  >
                    <Icon name={item.visible ? "eye" : "close"} size={14} />
                  </span>
                </button>
              ))}
            </div>
            <div className="layer-tip"><span className="tip-icon">✦</span><span><b>Tip</b> · Drag layers to reorder your page.</span></div>
          </>
        ) : (
          <div className="blocks-content">
            <div className="block-intro">Add to your page<span>Click a block to add it to the canvas.</span></div>
            <div className="block-grid">
              {blockOptions.map(({ type, label }) => (
                <button className="block-card" key={type} disabled={!canEdit} onClick={() => onAdd(type)}>
                  <span className={`block-icon ${type}`}><Icon name={iconFor(type)} size={19} /></span>
                  <span>{label}</span><Icon name="plus" size={13} />
                </button>
              ))}
            </div>
            <div className="block-note">More blocks and templates coming soon.</div>
          </div>
        )}
        <div className="left-panel-bottom">
          <div className="workspace-user">
            <div className="avatar small">{(user.name?.[0] ?? user.email[0] ?? "M").toUpperCase()}</div>
            <div>
              {authEnabled && user.workspaces.length > 1 ? (
                <select className="workspace-select" aria-label="Switch workspace" value={user.workspaceId} onChange={(event) => onSwitchWorkspace(event.target.value)}>
                  {user.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.role}</option>)}
                </select>
              ) : <b>{authEnabled ? user.workspaceName : "Local preview"}</b>}
              <span>{authEnabled ? `${user.role} · workspace` : "Not signed in"}</span>
            </div>
            <button className="workspace-access-button" disabled={!canManageMembers} title="Manage workspace access" onClick={onOpenMembers}>Access</button>
          </div>
        </div>
      </aside>
    </>
  );
}

type InspectorProps = {
  Icon: IconComponent;
  active?: EditorLayer;
  canEdit: boolean;
  inspectorTab: "style" | "content";
  iconFor: (type: LayerType) => IconName;
  onTabChange: (tab: "style" | "content") => void;
  onUpdate: (key: "name" | "text" | "color" | "fontSize", value: string | number) => void;
  onUpdateStyle: (key: keyof NodeStyles, value: NodeStyles[keyof NodeStyles]) => void;
  onDelete: () => void;
};

export function InspectorPanel({
  Icon,
  active,
  canEdit,
  inspectorTab,
  iconFor,
  onTabChange,
  onUpdate,
  onUpdateStyle,
  onDelete,
}: InspectorProps) {
  const gap = Number.parseFloat(active?.styles?.gap ?? "");

  return (
    <aside className="right-panel">
      <div className="inspector-header">
        <div><div className="eyebrow-label">INSPECTOR</div><h2>{active?.name ?? "Selection"}</h2></div>
        <button className="small-icon-button" title="More options are not available yet" disabled><Icon name="more" size={17} /></button>
      </div>
      <div className="inspector-tabs">
        <button className={inspectorTab === "style" ? "selected" : ""} onClick={() => onTabChange("style")}>Style</button>
        <button className={inspectorTab === "content" ? "selected" : ""} onClick={() => onTabChange("content")}>Content</button>
      </div>
      {inspectorTab === "style" ? (
        <div className="inspector-body">
          <div className="selection-chip">
            <span className="chip-icon"><Icon name={iconFor(active?.type ?? "heading")} size={14} /></span>
            <span>{active?.type ?? "element"}</span>
            <button title="Delete selected element" disabled={!canEdit} onClick={onDelete}><Icon name="close" size={14} /></button>
          </div>
          <section className="inspector-section">
            <div className="section-label">Layout <Icon name="chevron" size={14} /></div>
            <div className="control-row">
              <label htmlFor="display-style">Display</label>
              <select id="display-style" className="select-control" disabled={!canEdit} value={active?.styles?.display ?? "block"} onChange={(event) => onUpdateStyle("display", event.target.value as NodeStyles["display"])}>
                <option value="block">Block</option><option value="flex">Flex</option><option value="grid">Grid</option><option value="inline-flex">Inline flex</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="direction-style">Direction</label>
              <select id="direction-style" className="select-control" disabled={!canEdit} value={active?.styles?.flexDirection ?? "row"} onChange={(event) => onUpdateStyle("flexDirection", event.target.value as NodeStyles["flexDirection"])}>
                <option value="row">Row</option><option value="column">Column</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="align-style">Align</label>
              <select id="align-style" className="select-control" disabled={!canEdit} value={active?.styles?.textAlign ?? "left"} onChange={(event) => onUpdateStyle("textAlign", event.target.value as NodeStyles["textAlign"])}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option>
              </select>
            </div>
          </section>
          <section className="inspector-section">
            <div className="section-label">Spacing <Icon name="chevron" size={14} /></div>
            <div className="spacing-diagram"><div className="spacing-label top">24</div><div className="spacing-inner"><span>16</span><div className="spacing-center">Content</div><span>16</span></div><div className="spacing-label bottom">24</div></div>
            <div className="control-row"><label htmlFor="gap-style">Gap</label><label className="number-control"><input id="gap-style" type="number" min="0" disabled={!canEdit} value={Number.isNaN(gap) ? 0 : gap} onChange={(event) => onUpdateStyle("gap", `${event.target.value}px`)} /><span>px</span></label></div>
          </section>
          <section className="inspector-section">
            <div className="section-label">Typography <Icon name="chevron" size={14} /></div>
            <div className="control-row">
              <label htmlFor="font-style">Font</label>
              <select id="font-style" className="select-control" disabled={!canEdit} value={active?.styles?.fontFamily ?? "DM Sans"} onChange={(event) => onUpdateStyle("fontFamily", event.target.value)}>
                <option>DM Sans</option><option>Manrope</option><option>Arial</option><option>Georgia</option>
              </select>
            </div>
            <div className="control-row">
              <label>Size</label>
              <label className="number-control"><input aria-label="Font size" type="number" min="8" max="144" disabled={!canEdit} value={active?.fontSize ?? (active?.type === "heading" ? 72 : 16)} onChange={(event) => onUpdate("fontSize", Number(event.target.value))} /><span>px</span></label>
            </div>
            <div className="control-row">
              <label htmlFor="weight-style">Weight</label>
              <select id="weight-style" className="select-control" disabled={!canEdit} value={String(active?.styles?.fontWeight ?? (active?.type === "heading" ? 600 : 400))} onChange={(event) => onUpdateStyle("fontWeight", Number(event.target.value))}>
                <option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option>
              </select>
            </div>
          </section>
          <section className="inspector-section">
            <div className="section-label">Color <Icon name="chevron" size={14} /></div>
            <label className="color-field"><input aria-label="Text color" type="color" disabled={!canEdit} value={active?.color ?? "#20231f"} onChange={(event) => onUpdate("color", event.target.value)} /><span>{active?.color ?? "#20231f"}</span><span className="color-opacity">100%</span></label>
          </section>
        </div>
      ) : (
        <div className="inspector-body content-body">
          <label className="field-label">Layer name<input value={active?.name ?? ""} disabled={!canEdit} onChange={(event) => onUpdate("name", event.target.value)} /></label>
          <label className="field-label">
            {active?.type === "image" ? "Alt text" : active?.type === "button" ? "Button label" : "Text content"}
            <textarea rows={4} value={active?.text ?? ""} disabled={!canEdit} onChange={(event) => onUpdate("text", event.target.value)} />
          </label>
          <p className="field-help">Changes update the canvas instantly.</p>
        </div>
      )}
      <div className="right-panel-bottom"><button className="delete-button" onClick={onDelete}><Icon name="close" size={15} /> Delete element</button></div>
    </aside>
  );
}
