import { useRef, useState } from "react";
import type { AuthUser } from "../auth/context/auth-context";
import type { NodeStyles } from "@visual-builder/document-schema";
import type { EditorLayer, LayerType } from "../../lib/page-model";
import { Icon, type IconName } from "../icons/Icon";
import { InsertPanel } from "./InsertPanel";
import type { LayoutOption } from "./layer-config";

type IconComponent = typeof Icon;
type LayerRow = { item: EditorLayer; depth: number };

type SidebarProps = {
  Icon: IconComponent;
  user: AuthUser;
  authEnabled: boolean;
  canEdit: boolean;
  canManageMembers: boolean;
  filteredItems: LayerRow[];
  pages: Array<{ id: string; name: string }>;
  activePageId: string;
  activePageName: string;
  selectedId: string;
  tab: "layers" | "blocks";
  search: string;
  iconFor: (type: LayerType) => IconName;
  onTabChange: (tab: "layers" | "blocks") => void;
  onLoadDemo: () => void;
  onCreatePage: () => void;
  onSwitchPage: (id: string) => void;
  onRenamePage: (id: string, name: string) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onSearchChange: (search: string) => void;
  onSelect: (id: string) => void;
  onAdd: (type: LayerType) => void;
  onAddInsertPreset: (preset: "text-link" | "blockquote") => void;
  onAddLayout: (layout: LayoutOption["id"]) => void;
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
  pages,
  activePageId,
  activePageName,
  selectedId,
  tab,
  search,
  iconFor,
  onTabChange,
  onLoadDemo,
  onCreatePage,
  onSwitchPage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
  onSearchChange,
  onSelect,
  onAdd,
  onAddInsertPreset,
  onAddLayout,
  onAssetSelect,
  onAiOpen,
  onToggleVisibility,
  onReorder,
  onSwitchWorkspace,
  onOpenMembers,
}: SidebarProps) {
  const assetInput = useRef<HTMLInputElement>(null);
  const [openPageMenu, setOpenPageMenu] = useState<string | null>(null);

  return (
    <>
      <aside className="left-rail">
        <button className="rail-button active" title="Builder">
          <Icon name="grid" />
        </button>
        <button className="rail-button" title="Insert" onClick={() => onTabChange("blocks")}>
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
            <h1>{tab === "blocks" ? "Insert" : <>Pages <span className="page-count">{pages.length}</span></>}</h1>
          </div>
          {tab === "layers" && <button className="small-icon-button" title="Add page" disabled={!canEdit} onClick={onCreatePage}><Icon name="plus" size={17} /></button>}
        </div>
        {tab === "layers" && <div className="page-list">
          {pages.map((page) => (
            <div className="page-entry" key={page.id}>
              <button
                className={`page-row ${page.id === activePageId ? "active" : ""}`}
                onClick={() => { setOpenPageMenu(null); onSwitchPage(page.id); }}
                title={page.name}
              >
                <span className="page-glyph">{page.id === "home-page" ? "⌂" : "▤"}</span><span className="page-row-name">{page.name}</span>
              </button>
              <button
                className="page-menu-trigger"
                disabled={!canEdit}
                aria-label={`Actions for ${page.name}`}
                aria-haspopup="menu"
                aria-expanded={openPageMenu === page.id}
                onClick={() => setOpenPageMenu((current) => current === page.id ? null : page.id)}
              >
                <Icon name="more" size={16} />
              </button>
              {openPageMenu === page.id && <div className="page-actions-menu" role="menu">
                <button role="menuitem" onClick={() => {
                  const name = window.prompt("Rename page", page.name);
                  if (name) onRenamePage(page.id, name);
                  setOpenPageMenu(null);
                }}>Rename</button>
                <button role="menuitem" onClick={() => { onDuplicatePage(page.id); setOpenPageMenu(null); }}>Duplicate</button>
                <button role="menuitem" className="page-delete-action" disabled={pages.length <= 1} title={pages.length <= 1 ? "Keep at least one page" : "Delete page"} onClick={() => {
                  if (window.confirm(`Delete “${page.name}”? This cannot be undone.`)) onDeletePage(page.id);
                  setOpenPageMenu(null);
                }}>Delete</button>
              </div>}
            </div>
          ))}
        </div>}
        <div className="panel-tabs">
          <button className={tab === "layers" ? "selected" : ""} onClick={() => onTabChange("layers")}>
            <Icon name="layers" size={15} /> Layers
          </button>
          <button className={tab === "blocks" ? "selected" : ""} onClick={() => onTabChange("blocks")}>
            <Icon name="grid" size={15} /> Blocks
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
              <span>{activePageName.toUpperCase()}</span>
              <button className="plain-icon" disabled={!canEdit} onClick={() => onAdd("section")}>
                <Icon name="plus" size={15} />
              </button>
            </div>
            <div className="layer-list">
              {filteredItems.map(({ item, depth }) => (
                <button
                  key={item.id}
                  className={`layer-row ${selectedId === item.id ? "selected" : ""}`}
                  draggable={canEdit && depth === 0}
                  onClick={() => onSelect(item.id)}
                  style={{ paddingLeft: 8 + depth * 12 }}
                  onDragStart={(event) => event.dataTransfer.setData("text/layer-id", item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (depth === 0) onReorder(event.dataTransfer.getData("text/layer-id"), item.id);
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
          <InsertPanel
            canEdit={canEdit}
            search={search}
            iconFor={iconFor}
            onSearchChange={onSearchChange}
            onLoadDemo={onLoadDemo}
            onAdd={onAdd}
            onAddInsertPreset={onAddInsertPreset}
            onAddLayout={onAddLayout}
          />
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
  onUpdate: (key: "name" | "text" | "color" | "fontSize" | "level", value: string | number) => void;
  onUpdateStyle: (key: keyof NodeStyles, value: NodeStyles[keyof NodeStyles]) => void;
  onUploadImage: (file: File) => void;
  onDelete: () => void;
};

const fontFamilies = [
  "DM Sans", "Manrope", "Inter", "Poppins", "Montserrat", "Roboto", "Open Sans",
  "Source Sans 3", "Space Grotesk", "Playfair Display", "Lora", "Merriweather", "Arial", "Georgia",
];

const boxSpacingFields: Array<{ key: keyof NodeStyles; shorthand: keyof NodeStyles; side: number; label: string }> = [
  { key: "paddingTop", shorthand: "padding", side: 0, label: "Padding top" },
  { key: "paddingRight", shorthand: "padding", side: 1, label: "Padding right" },
  { key: "paddingBottom", shorthand: "padding", side: 2, label: "Padding bottom" },
  { key: "paddingLeft", shorthand: "padding", side: 3, label: "Padding left" },
  { key: "marginTop", shorthand: "margin", side: 0, label: "Margin top" },
  { key: "marginRight", shorthand: "margin", side: 1, label: "Margin right" },
  { key: "marginBottom", shorthand: "margin", side: 2, label: "Margin bottom" },
  { key: "marginLeft", shorthand: "margin", side: 3, label: "Margin left" },
];

function boxSideValue(value: string | undefined, side: number): string | undefined {
  if (!value) return undefined;
  const parts = value.trim().split(/\s+/);
  const valueAtSide = parts.length === 1
    ? parts[0]
    : parts.length === 2
      ? side === 0 || side === 2 ? parts[0] : parts[1]
      : parts.length === 3
        ? side === 0 ? parts[0] : side === 2 ? parts[2] : parts[1]
        : parts[side];
  if (!valueAtSide) return undefined;
  if (valueAtSide === "auto") return "auto";
  return /^-?\d*\.?\d+$/.test(valueAtSide) ? `${valueAtSide}px` : valueAtSide;
}

function LengthControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value?: string;
  disabled: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const match = /^(-?\d*\.?\d+)(px|%|rem|vh|vw)$/.exec(value ?? "");
  const unit = value === "auto" ? "auto" : match?.[2] ?? "px";
  const number = match?.[1] ?? "";

  return (
    <div className="style-control-row">
      <label>{label}</label>
      <div className="length-control">
        <input
          aria-label={label}
          type="number"
          step="1"
          disabled={disabled || unit === "auto"}
          value={number}
          placeholder={unit === "auto" ? "auto" : "0"}
          onChange={(event) => onChange(event.target.value ? `${event.target.value}${unit}` : undefined)}
        />
        <select aria-label={`${label} unit`} disabled={disabled} value={unit} onChange={(event) => {
          const nextUnit = event.target.value;
          onChange(nextUnit === "auto" ? "auto" : `${number || "0"}${nextUnit}`);
        }}>
          <option value="px">px</option><option value="%">%</option><option value="rem">rem</option>
          <option value="vh">vh</option><option value="vw">vw</option><option value="auto">auto</option>
        </select>
      </div>
    </div>
  );
}

function ColorControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-control">
      <span>{label}</span>
      <input aria-label={label} type="color" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} />
      <code>{value}</code>
    </label>
  );
}

export function InspectorPanel({
  Icon,
  active,
  canEdit,
  inspectorTab,
  iconFor,
  onTabChange,
  onUpdate,
  onUpdateStyle,
  onUploadImage,
  onDelete,
}: InspectorProps) {
  const imageInput = useRef<HTMLInputElement>(null);
  const styles = active?.styles ?? {};

  return (
    <aside className="right-panel">
      <div className="inspector-header">
        <div><div className="eyebrow-label">INSPECTOR</div><h2>{active?.name ?? "Selection"}</h2></div>
        <button className="small-icon-button" title="More options are not available yet" disabled><Icon name="more" size={17} /></button>
      </div>
      <div className="inspector-tabs">
        <button className={inspectorTab === "style" ? "selected" : ""} onClick={() => onTabChange("style")}>Style</button>
        <button className={inspectorTab === "content" ? "selected" : ""} onClick={() => onTabChange("content")}>Properties</button>
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
              <select id="direction-style" className="select-control" disabled={!canEdit || !["flex", "inline-flex"].includes(styles.display ?? "block")} value={styles.flexDirection ?? "row"} onChange={(event) => onUpdateStyle("flexDirection", event.target.value as NodeStyles["flexDirection"])}>
                <option value="row">Row</option><option value="column">Column</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="text-align-style">Text align</label>
              <select id="text-align-style" className="select-control" disabled={!canEdit} value={styles.textAlign ?? "left"} onChange={(event) => onUpdateStyle("textAlign", event.target.value as NodeStyles["textAlign"])}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="align-items-style">Align items</label>
              <select id="align-items-style" className="select-control" disabled={!canEdit || !["flex", "inline-flex", "grid"].includes(styles.display ?? "block")} value={styles.alignItems ?? "stretch"} onChange={(event) => onUpdateStyle("alignItems", event.target.value as NodeStyles["alignItems"])}>
                <option value="stretch">Stretch</option><option value="flex-start">Start</option><option value="center">Center</option><option value="flex-end">End</option><option value="baseline">Baseline</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="justify-content-style">Justify</label>
              <select id="justify-content-style" className="select-control" disabled={!canEdit || !["flex", "inline-flex", "grid"].includes(styles.display ?? "block")} value={styles.justifyContent ?? "flex-start"} onChange={(event) => onUpdateStyle("justifyContent", event.target.value as NodeStyles["justifyContent"])}>
                <option value="flex-start">Start</option><option value="center">Center</option><option value="flex-end">End</option><option value="space-between">Space between</option><option value="space-around">Space around</option><option value="space-evenly">Space evenly</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="flex-wrap-style">Wrap</label>
              <select id="flex-wrap-style" className="select-control" disabled={!canEdit || !["flex", "inline-flex"].includes(styles.display ?? "block")} value={styles.flexWrap ?? "nowrap"} onChange={(event) => onUpdateStyle("flexWrap", event.target.value as NodeStyles["flexWrap"])}>
                <option value="nowrap">No wrap</option><option value="wrap">Wrap</option><option value="wrap-reverse">Reverse</option>
              </select>
            </div>
            {styles.display === "grid" && <div className="control-row">
              <label htmlFor="grid-columns-style">Columns</label>
              <select id="grid-columns-style" className="select-control" disabled={!canEdit} value={styles.gridTemplateColumns ?? "1fr"} onChange={(event) => onUpdateStyle("gridTemplateColumns", event.target.value)}>
                <option value="1fr">One column</option><option value="repeat(2, 1fr)">Two columns</option><option value="repeat(3, 1fr)">Three columns</option><option value="repeat(auto-fit, minmax(220px, 1fr))">Responsive cards</option><option value="repeat(auto-fit, minmax(320px, 1fr))">Responsive sections</option>
              </select>
            </div>}
          </section>
          <section className="inspector-section">
            <div className="section-label">Spacing <Icon name="chevron" size={14} /></div>
            <div className="style-field-grid">
              {boxSpacingFields.map(({ key, shorthand, side, label }) => (
                <LengthControl key={key} label={label} value={styles[key] as string | undefined ?? boxSideValue(styles[shorthand] as string | undefined, side)} disabled={!canEdit} onChange={(value) => onUpdateStyle(key, value)} />
              ))}
            </div>
            <LengthControl label="Gap" value={styles.gap} disabled={!canEdit} onChange={(value) => onUpdateStyle("gap", value)} />
          </section>
          <section className="inspector-section">
            <div className="section-label">Size <Icon name="chevron" size={14} /></div>
            <div className="style-field-grid">
              <LengthControl label="Width" value={styles.width} disabled={!canEdit} onChange={(value) => onUpdateStyle("width", value)} />
              <LengthControl label="Height" value={styles.height} disabled={!canEdit} onChange={(value) => onUpdateStyle("height", value)} />
              <LengthControl label="Min width" value={styles.minWidth} disabled={!canEdit} onChange={(value) => onUpdateStyle("minWidth", value)} />
              <LengthControl label="Min height" value={styles.minHeight} disabled={!canEdit} onChange={(value) => onUpdateStyle("minHeight", value)} />
              <LengthControl label="Max width" value={styles.maxWidth} disabled={!canEdit} onChange={(value) => onUpdateStyle("maxWidth", value)} />
              <LengthControl label="Max height" value={styles.maxHeight} disabled={!canEdit} onChange={(value) => onUpdateStyle("maxHeight", value)} />
            </div>
          </section>
          <section className="inspector-section">
            <div className="section-label">Typography <Icon name="chevron" size={14} /></div>
            <div className="control-row">
              <label htmlFor="font-style">Font</label>
              <select id="font-style" className="select-control" disabled={!canEdit} value={active?.styles?.fontFamily ?? "DM Sans"} onChange={(event) => onUpdateStyle("fontFamily", event.target.value)}>
                {fontFamilies.map((font) => <option key={font}>{font}</option>)}
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
            <div className="control-row">
              <label htmlFor="line-height-style">Line height</label>
              <input id="line-height-style" className="text-style-control" disabled={!canEdit} placeholder="1.4" value={String(styles.lineHeight ?? "")} onChange={(event) => onUpdateStyle("lineHeight", event.target.value || undefined)} />
            </div>
            <div className="control-row">
              <label htmlFor="letter-spacing-style">Letter spacing</label>
              <input id="letter-spacing-style" className="text-style-control" disabled={!canEdit} placeholder="0px" value={styles.letterSpacing ?? ""} onChange={(event) => onUpdateStyle("letterSpacing", event.target.value || undefined)} />
            </div>
            <div className="control-row">
              <label htmlFor="decoration-style">Decoration</label>
              <select id="decoration-style" className="select-control" disabled={!canEdit} value={styles.textDecoration ?? "none"} onChange={(event) => onUpdateStyle("textDecoration", event.target.value as NodeStyles["textDecoration"])}>
                <option value="none">None</option><option value="underline">Underline</option><option value="line-through">Strike through</option>
              </select>
            </div>
          </section>
          <section className="inspector-section">
            <div className="section-label">Appearance <Icon name="chevron" size={14} /></div>
            <ColorControl label="Text color" value={active?.color ?? "#20231f"} disabled={!canEdit} onChange={(value) => onUpdate("color", value)} />
            <ColorControl label="Background" value={styles.backgroundColor ?? "#ffffff"} disabled={!canEdit} onChange={(value) => onUpdateStyle("backgroundColor", value)} />
            <div className="style-field-grid">
              <LengthControl label="Radius" value={styles.borderRadius} disabled={!canEdit} onChange={(value) => onUpdateStyle("borderRadius", value)} />
              <LengthControl label="Border width" value={styles.borderWidth} disabled={!canEdit} onChange={(value) => onUpdateStyle("borderWidth", value)} />
            </div>
            <div className="control-row">
              <label htmlFor="border-style">Border style</label>
              <select id="border-style" className="select-control" disabled={!canEdit} value={styles.borderStyle ?? "solid"} onChange={(event) => onUpdateStyle("borderStyle", event.target.value as NodeStyles["borderStyle"])}>
                <option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
              </select>
            </div>
            <ColorControl label="Border color" value={styles.borderColor ?? "#d9d9dd"} disabled={!canEdit} onChange={(value) => onUpdateStyle("borderColor", value)} />
            <div className="control-row">
              <label htmlFor="shadow-style">Shadow</label>
              <select id="shadow-style" className="select-control" disabled={!canEdit} value={styles.boxShadow ?? "none"} onChange={(event) => onUpdateStyle("boxShadow", event.target.value || undefined)}>
                <option value="none">None</option><option value="0 1px 4px #00000020">Soft</option><option value="0 8px 24px #00000018">Raised</option><option value="0 12px 36px #00000030">Strong</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="overflow-style">Overflow</label>
              <select id="overflow-style" className="select-control" disabled={!canEdit} value={styles.overflow ?? "visible"} onChange={(event) => onUpdateStyle("overflow", event.target.value as NodeStyles["overflow"])}>
                <option value="visible">Visible</option><option value="hidden">Hidden</option><option value="auto">Scroll</option>
              </select>
            </div>
            <div className="style-control-row opacity-control">
              <label htmlFor="opacity-style">Opacity · {Math.round((styles.opacity ?? 1) * 100)}%</label>
              <input id="opacity-style" type="range" min="0" max="100" value={Math.round((styles.opacity ?? 1) * 100)} disabled={!canEdit} onChange={(event) => onUpdateStyle("opacity", Number(event.target.value) / 100)} />
            </div>
          </section>
        </div>
      ) : (
        <div className="inspector-body content-body">
          <label className="field-label">Layer name<input value={active?.name ?? ""} disabled={!canEdit} onChange={(event) => onUpdate("name", event.target.value)} /></label>
          <label className="field-label">
            {active?.type === "image" ? "Alt text" : active?.type === "button" ? "Button label" : "Text content"}
            <textarea rows={4} value={active?.text ?? ""} disabled={!canEdit} onChange={(event) => onUpdate("text", event.target.value)} />
          </label>
          {active?.type === "heading" && <label className="field-label">Heading level
            <select className="select-control" disabled={!canEdit} value={active.level ?? "h1"} onChange={(event) => onUpdate("level", event.target.value)}>
              <option value="h1">H1 · Main heading</option><option value="h2">H2 · Section heading</option><option value="h3">H3</option><option value="h4">H4</option><option value="h5">H5</option><option value="h6">H6</option>
            </select>
          </label>}
          {active?.type === "image" && <>
            <input ref={imageInput} hidden type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadImage(file);
              event.target.value = "";
            }} />
            <button className="modal-primary" disabled={!canEdit} onClick={() => imageInput.current?.click()}>Replace image</button>
            {active.src && <img className="inspector-image-preview" src={active.src} alt={active.text} />}
          </>}
          <p className="field-help">Changes update the canvas instantly.</p>
        </div>
      )}
      <div className="right-panel-bottom"><button className="delete-button" disabled={!canEdit || !active} onClick={onDelete}><Icon name="close" size={15} /> Delete element</button></div>
    </aside>
  );
}
