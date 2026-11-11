import clsx from "clsx";
import type { AuthUser } from "../auth/context/auth-context";
import { Canvas } from "../canvas/Canvas";
import type { EditorLayer } from "../../lib/page-model";
import { Icon } from "../icons/Icon";

type HeaderProps = {
  pageName: string;
  theme: "light" | "dark";
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
  onToggleTheme: () => void;
};

export function EditorHeader({
  pageName,
  theme,
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
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="topbar animate-fade-in">
      <div className="brand">
        <div className="brand-mark">
          <span />
        </div>
        <span>
          canvas<span className="brand-dot">.</span>
        </span>
        <span className="brand-divider" />
        <span className="project-name">
          Untitled website <Icon name="chevron" size={14} />
        </span>
      </div>
      <div className="top-center">
        <span className={`save-dot ${saved ? "is-saved" : ""}`} />
        {saved ? "All changes saved" : "Unsaved changes"}
        <span className="top-separator" />{" "}
        <span className="page-path">{pageName}</span>
      </div>
      <div className="top-actions">
        <button
          className="icon-button"
          title="Undo"
          onClick={onUndo}
          disabled={!canEdit || !undoCount}
        >
          <Icon name="undo" size={17} />
        </button>
        <button
          className="icon-button"
          title="Redo"
          onClick={onRedo}
          disabled={!canEdit || !redoCount}
        >
          <Icon name="redo" size={17} />
        </button>
        <button
          className="icon-button theme-toggle"
          type="button"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-pressed={theme === "dark"}
          onClick={onToggleTheme}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>
        <span className="top-separator" />
        <button className="share-button" onClick={onShare} disabled={!canShare}>
          Share
        </button>
        <button
          className="publish-button"
          onClick={onPublish}
          disabled={!canPublish}
        >
          <Icon name="check" size={15} /> Publish
        </button>
        <button
          className="avatar account-avatar"
          title={
            authEnabled
              ? `Signed in as ${user.email}. Click to sign out.`
              : "Local preview account"
          }
          onClick={onSignOut}
        >
          {(user.name?.[0] ?? user.email[0] ?? "M").toUpperCase()}
        </button>
      </div>
    </header>
  );
}

type CanvasPanelProps = {
  pageName: string;
  items: EditorLayer[];
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
  pageName,
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
    <main className="editor-main flex min-h-0 min-w-75 flex-1 flex-col bg-(--editor-bg)">
      <div className="canvas-toolbar flex h-12 flex-none items-center justify-between border-b border-(--editor-border) bg-(--panel-bg) px-5">
        <div className="canvas-breadcrumb flex items-center gap-2">
          <span>{pageName}</span>
          <span className="crumb-slash">/</span>
          <span>{activeName}</span>
        </div>
        <div className="canvas-tools flex items-center gap-1">
          <button
            className={clsx(
              "tool-button h-7 w-7.25 rounded-md",
              device === "desktop" && "tool-selected",
            )}
            onClick={() => onDeviceChange("desktop")}
            title="Desktop"
          >
            <Icon name="desktop" size={16} />
          </button>
          <button
            className={clsx(
              "tool-button h-7 w-7.25 rounded-md",
              device === "mobile" && "tool-selected",
            )}
            onClick={() => onDeviceChange("mobile")}
            title="Mobile"
          >
            <Icon name="mobile" size={16} />
          </button>
          <span className="tool-divider" />
          <button
            className={clsx(
              "tool-button h-7 w-7.25 rounded-md",
              preview && "tool-selected",
            )}
            onClick={onPreviewToggle}
            title="Preview"
          >
            <Icon name="eye" size={17} />
          </button>
          <span className="tool-divider" />
          <button className="zoom-control" onClick={onZoom}>
            {zoom}% <Icon name="chevron" size={13} />
          </button>
          <button
            className="tool-button"
            title="Export project JSON"
            onClick={onExportProject}
          >
            <Icon name="download" size={16} />
          </button>
          <button
            className="tool-button"
            title="Export React or Next.js code"
            onClick={onExportCode}
          >
            <Icon name="code" size={16} />
          </button>
        </div>
      </div>
      <div className="canvas-stage relative flex min-h-0 flex-1 flex-col items-center justify-start overflow-auto px-7.5 pb-5 pt-9.5 max-[820px]:px-3.75 max-[820px]:pt-5">
        <div
          className={clsx(
            "page-canvas",
            device === "mobile" && "mobile-canvas",
            preview && "preview-mode",
          )}
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <Canvas
            items={items}
            selectedId={selectedId}
            preview={preview}
            onSelect={onSelect}
          />
        </div>
        <div className="canvas-outside-label">
          Designed with{" "}
          <b>
            canvas<span>.</span>
          </b>
        </div>
      </div>
      <div className="bottom-bar flex h-7.75 flex-none items-center gap-4.5 border-t border-(--editor-border) bg-(--panel-bg) px-4 text-[9px] text-(--text-muted)">
        <span className="flex items-center gap-1.5 text-(--text-primary)">
          <span className="online-dot" /> Live canvas
        </span>
        <span>Last saved just now</span>
        <button
          className="ml-auto border-0 bg-transparent text-[9px] text-(--text-secondary)"
          onClick={onSaveNow}
        >
          Save now{" "}
          <span className="ml-1.5 rounded border border-(--editor-border) px-1 py-0.5 text-[8px] text-(--text-muted)">
            ⌘ S
          </span>
        </button>
      </div>
    </main>
  );
}
