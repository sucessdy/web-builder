import { useRef, useState } from "react";
import clsx from "clsx";
import type { NodeStyles } from "@visual-builder/document-schema";
import type { EditorLayer, LayerType } from "../../../lib/page-model";
import { Icon, type IconName } from "../../icons/Icon";
import { IMAGE_UPLOAD_ACCEPT } from "../../../lib/api-client";
import { styleControlSections } from "../inspector/style-control-registry";

type IconComponent = typeof Icon;

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
  uploadingAsset: boolean;
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
  const [draft, setDraft] = useState(number);
  const [editing, setEditing] = useState(false);

  const finishEditing = () => {
    setEditing(false);
    const numericValue = Number(draft);
    const nextNumber = draft.trim() && Number.isFinite(numericValue)
      ? String(numericValue)
      : "0";
    setDraft(nextNumber);
    onChange(`${nextNumber}${unit === "auto" ? "px" : unit}`);
  };

  return (
    <div className="style-control-row">
      <label>{label}</label>
      <div className="length-control">
        <input
          aria-label={label}
          type="text"
          inputMode="decimal"
          disabled={disabled || unit === "auto"}
          value={editing ? draft : number}
          placeholder={unit === "auto" ? "auto" : "0"}
          onFocus={(event) => {
            setDraft(number);
            setEditing(true);
            event.currentTarget.select();
          }}
          onBlur={finishEditing}
          onChange={(event) => {
            const next = event.target.value;
            if (!/^-?\d*\.?\d*$/.test(next)) return;
            setDraft(next);
            const isPartialNumber = next === "" || next === "-" || next === "." || next === "-.";
            onChange(isPartialNumber ? undefined : `${next}${unit}`);
          }}
        />
        <select aria-label={`${label} unit`} disabled={disabled} value={unit} onChange={(event) => {
          const nextUnit = event.target.value;
          if (nextUnit === "auto") {
            onChange("auto");
            return;
          }
          const currentNumber = editing ? draft : number;
          const nextNumber = currentNumber && Number.isFinite(Number(currentNumber)) ? String(Number(currentNumber)) : "0";
          setDraft(nextNumber);
          onChange(`${nextNumber}${nextUnit}`);
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
  uploadingAsset,
  onDelete,
}: InspectorProps) {
  const imageInput = useRef<HTMLInputElement>(null);
  const styles = active?.styles ?? {};

  return (
    <aside className="right-panel flex min-h-0 w-[254px] flex-none flex-col border-l border-[var(--editor-border)] bg-[var(--panel-bg)] motion-safe:animate-slide-in max-[1120px]:w-[225px] max-[820px]:w-[205px]">
      <div className="inspector-header">
        <div><div className="eyebrow-label">INSPECTOR</div><h2>{active?.name ?? "Selection"}</h2></div>
        <button className="small-icon-button" title="More options are not available yet" disabled><Icon name="more" size={17} /></button>
      </div>
      <div className="inspector-tabs flex h-[38px] flex-none gap-5 border-b border-[var(--editor-border)] px-[15px]">
        <button className={clsx("relative border-0 bg-transparent px-0.5 text-[10px] font-semibold", inspectorTab === "style" && "selected")} onClick={() => onTabChange("style")}>Style</button>
        <button className={clsx("relative border-0 bg-transparent px-0.5 text-[10px] font-semibold", inspectorTab === "content" && "selected")} onClick={() => onTabChange("content")}>Properties</button>
      </div>
      {inspectorTab === "style" ? (
        <div className="inspector-body">
          <div className="selection-chip">
            <span className="chip-icon"><Icon name={iconFor(active?.type ?? "heading")} size={14} /></span>
            <span>{active?.type ?? "element"}</span>
            <button title="Delete selected element" disabled={!canEdit} onClick={onDelete}><Icon name="close" size={14} /></button>
          </div>
          {styleControlSections.map(({ label, controls }) => (
            <section className="inspector-section animate-fade-in" key={label}>
              <div className="section-label">{label}<Icon name="chevron" size={14} /></div>
              {controls.map((control) => {
                const key = control.key as keyof NodeStyles;
                const visible = !control.visibleWhen || control.visibleWhen.values.includes(
                  String(styles[control.visibleWhen.key as keyof NodeStyles] ?? "block"),
                );
                const enabled = !control.enabledWhen || control.enabledWhen.values.includes(
                  String(styles[control.enabledWhen.key as keyof NodeStyles] ?? "block"),
                );
                if (!visible) return null;

                return (
                  <label className={clsx("control-row text-[10px] leading-tight text-[var(--text-secondary)]", !enabled && "opacity-60")} htmlFor={`style-${String(key)}`} key={`${active?.id ?? "selection"}-${control.key}`}>
                    <span className="text-[10px] leading-tight text-[var(--text-secondary)]">{control.label}</span>
                    <select
                      id={`style-${String(key)}`}
                      className="select-control"
                      disabled={!canEdit || !enabled}
                      value={String(styles[key] ?? control.defaultValue)}
                      onChange={(event) => onUpdateStyle(key, event.target.value as NodeStyles[keyof NodeStyles])}
                    >
                      {control.options.map(({ label: optionLabel, value }) => (
                        <option key={value} value={value}>{optionLabel}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </section>
          ))}
          <section className="inspector-section">
            <div className="section-label">Spacing <Icon name="chevron" size={14} /></div>
            <div className="style-field-grid">
              {boxSpacingFields.map(({ key, shorthand, side, label }) => (
                <LengthControl key={`${active?.id ?? "selection"}-${key}`} label={label} value={styles[key] as string | undefined ?? boxSideValue(styles[shorthand] as string | undefined, side)} disabled={!canEdit} onChange={(value) => onUpdateStyle(key, value)} />
              ))}
            </div>
            <LengthControl key={`${active?.id ?? "selection"}-gap`} label="Gap" value={styles.gap} disabled={!canEdit} onChange={(value) => onUpdateStyle("gap", value)} />
          </section>
          <section className="inspector-section">
            <div className="section-label">Size <Icon name="chevron" size={14} /></div>
            <div className="style-field-grid">
              <LengthControl key={`${active?.id ?? "selection"}-width`} label="Width" value={styles.width} disabled={!canEdit} onChange={(value) => onUpdateStyle("width", value)} />
              <LengthControl key={`${active?.id ?? "selection"}-height`} label="Height" value={styles.height} disabled={!canEdit} onChange={(value) => onUpdateStyle("height", value)} />
              <LengthControl key={`${active?.id ?? "selection"}-min-width`} label="Min width" value={styles.minWidth} disabled={!canEdit} onChange={(value) => onUpdateStyle("minWidth", value)} />
              <LengthControl key={`${active?.id ?? "selection"}-min-height`} label="Min height" value={styles.minHeight} disabled={!canEdit} onChange={(value) => onUpdateStyle("minHeight", value)} />
              <LengthControl key={`${active?.id ?? "selection"}-max-width`} label="Max width" value={styles.maxWidth} disabled={!canEdit} onChange={(value) => onUpdateStyle("maxWidth", value)} />
              <LengthControl key={`${active?.id ?? "selection"}-max-height`} label="Max height" value={styles.maxHeight} disabled={!canEdit} onChange={(value) => onUpdateStyle("maxHeight", value)} />
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
              <LengthControl key={`${active?.id ?? "selection"}-border-radius`} label="Radius" value={styles.borderRadius} disabled={!canEdit} onChange={(value) => onUpdateStyle("borderRadius", value)} />
              <LengthControl key={`${active?.id ?? "selection"}-border-width`} label="Border width" value={styles.borderWidth} disabled={!canEdit} onChange={(value) => onUpdateStyle("borderWidth", value)} />
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
            <input ref={imageInput} hidden type="file" accept={IMAGE_UPLOAD_ACCEPT} disabled={uploadingAsset} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadImage(file);
              event.target.value = "";
            }} />
            <button className="modal-primary" disabled={!canEdit || uploadingAsset} aria-busy={uploadingAsset} onClick={() => imageInput.current?.click()}>{uploadingAsset ? "Uploading image…" : "Replace image"}</button>
            {active.src && <img className="inspector-image-preview" src={active.src} alt={active.text} />}
          </>}
          <p className="field-help">Changes update the canvas instantly.</p>
        </div>
      )}
      <div className="right-panel-bottom"><button className="delete-button" disabled={!canEdit || !active} onClick={onDelete}><Icon name="close" size={15} /> Delete element</button></div>
    </aside>
  );
}
