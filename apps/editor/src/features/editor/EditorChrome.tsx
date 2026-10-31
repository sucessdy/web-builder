import type { AuthUser } from "../auth/context/auth-context";
import { Canvas } from "../canvas/Canvas";
import type { CanvasItem } from "../canvas/canvas-document";
import { Icon } from "../icons/Icon";

type HeaderProps = {
  user: AuthUser;
  authEnabled: boolean;
  canEdit: boolean;
  canShare: boolean;
  canPublish: boolean;
  saved: boolean;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onShare: () => void;
  onPublish: () => void;
  onSignOut: () => void;
};

export function EditorHeader({
  user,
  authEnabled,
  canEdit,
  canShare,
  canPublish,
  saved,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  onShare,
  onPublish,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><span /></div>
        <span>canvas<span className="brand-dot">.</span></span>
        <span className="brand-divider" />
        <span className="project-name">Untitled website <Icon name="chevron" size={14} /></span>
      </div>
      <div className="top-center">
        <span className={`save-dot ${saved ? "is-saved" : ""}`} />
        {saved ? "All changes saved" : "Unsaved changes"}
        <span className="top-separator" /> <span className="page-path">Home page</span>
      </div>
      <div className="top-actions">
        <button className="icon-button" title="Undo" onClick={onUndo} disabled={!canEdit || !undoCount}>
          <Icon name="undo" size={17} />
        </button>
        <button className="icon-button" title="Redo" onClick={onRedo} disabled={!canEdit || !redoCount}>
          <Icon name="redo" size={17} />
        </button>
        <span className="top-separator" />
        <button className="share-button" onClick={onShare} disabled={!canShare}>Share</button>
        <button className="publish-button" onClick={onPublish} disabled={!canPublish}>
          <Icon name="check" size={15} /> Publish
        </button>
        <button
          className="avatar account-avatar"
          title={authEnabled ? `Signed in as ${user.email}. Click to sign out.` : "Local preview account"}
          onClick={onSignOut}
        >
          {(user.name?.[0] ?? user.email[0] ?? "M").toUpperCase()}
        </button>
      </div>
    </header>
  );
}

type CanvasPanelProps = {
  items: CanvasItem[];
  selectedId: string;
  activeName?: string;
  device: "desktop" | "mobile";
  preview: boolean;
  zoom: number;
  onDeviceChange: (device: "desktop" | "mobile") => void;
  onPreviewToggle: () => void;
  onZoom: () => void;
  onExportProject: () => void;
  onExportCode: () => void;
  onSelect: (id: string) => void;
  onSaveNow: () => void;
};

export function EditorCanvasPanel({
  items,
  selectedId,
  activeName,
  device,
  preview,
  zoom,
  onDeviceChange,
  onPreviewToggle,
  onZoom,
  onExportProject,
  onExportCode,
  onSelect,
  onSaveNow,
}: CanvasPanelProps) {
  return (
    <main className="editor-main">
      <div className="canvas-toolbar">
        <div className="canvas-breadcrumb">
          <span>Home page</span><span className="crumb-slash">/</span><span>{activeName}</span>
        </div>
        <div className="canvas-tools">
          <button className={`tool-button ${device === "desktop" ? "tool-selected" : ""}`} onClick={() => onDeviceChange("desktop")} title="Desktop">
            <Icon name="desktop" size={16} />
          </button>
          <button className={`tool-button ${device === "mobile" ? "tool-selected" : ""}`} onClick={() => onDeviceChange("mobile")} title="Mobile">
            <Icon name="mobile" size={16} />
          </button>
          <span className="tool-divider" />
          <button className={`tool-button ${preview ? "tool-selected" : ""}`} onClick={onPreviewToggle} title="Preview">
            <Icon name="eye" size={17} />
          </button>
          <span className="tool-divider" />
          <button className="zoom-control" onClick={onZoom}>{zoom}% <Icon name="chevron" size={13} /></button>
          <button className="tool-button" title="Export project JSON" onClick={onExportProject}>
            <Icon name="download" size={16} />
          </button>
          <button className="tool-button" title="Export React or Next.js code" onClick={onExportCode}>
            <Icon name="code" size={16} />
          </button>
        </div>
      </div>
      <div className="canvas-stage">
        <div
          className={`page-canvas ${device === "mobile" ? "mobile-canvas" : ""} ${preview ? "preview-mode" : ""}`}
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <Canvas items={items} selectedId={selectedId} preview={preview} onSelect={onSelect} />
        </div>
        <div className="canvas-outside-label">Designed with <b>canvas<span>.</span></b></div>
      </div>
      <div className="bottom-bar">
        <span><span className="online-dot" /> Live canvas</span>
        <span>Last saved just now</span>
        <button onClick={onSaveNow}>Save now <span>⌘ S</span></button>
      </div>
    </main>
  );
}
