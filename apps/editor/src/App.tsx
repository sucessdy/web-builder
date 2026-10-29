import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, createCanvasDocument } from "./features/canvas/Canvas";
import {type WorkspaceMember } from "./features/auth/AuthProvider";
import { generatePageFromPrompt } from "./lib/ai-generator";
import { buildPageSource } from "./lib/code-export";
import "./App.css";
import { useAuth } from "./features/auth/useAuth";

type Kind = "section" | "heading" | "text" | "button" | "image";
type Item = {
  id: string;
  type: Kind;
  name: string;
  text: string;
  visible: boolean;
  color?: string;
  fontSize?: number;
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
};
type Tab = "layers" | "blocks";

const initialItems: Item[] = [
  {
    id: "nav",
    type: "section",
    name: "Navigation",
    text: "NORTH / STUDIO",
    visible: true,
  },
  {
    id: "eyebrow",
    type: "text",
    name: "Eyebrow",
    text: "INDEPENDENT DESIGN STUDIO · EST. 2014",
    visible: true,
  },
  {
    id: "title",
    type: "heading",
    name: "Hero heading",
    text: "Make room\nfor wonder.",
    visible: true,
  },
  {
    id: "body",
    type: "text",
    name: "Intro text",
    text: "We build thoughtful digital experiences for people shaping what comes next.",
    visible: true,
  },
  {
    id: "cta",
    type: "button",
    name: "Primary button",
    text: "Explore our work",
    visible: true,
  },
  {
    id: "hero-image",
    type: "image",
    name: "Hero image",
    text: "Abstract shapes in warm light",
    visible: true,
  },
];

const Icon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    type: (
      <>
        <path d="M4 7V4h16v3M12 4v16M8 20h8" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    text: (
      <>
        <path d="M4 7V4h16v3M12 4v16M8 20h8" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    undo: (
      <>
        <path d="M9 14 4 9l5-5" />
        <path d="M20 20v-5a6 6 0 0 0-6-6H4" />
      </>
    ),
    redo: (
      <>
        <path d="m15 14 5-5-5-5" />
        <path d="M4 20v-5a6 6 0 0 1 6-6h10" />
      </>
    ),
    desktop: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    mobile: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.4.8l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.4-.8l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.7l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.4-.8l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.4.8l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.6Z"
          transform="translate(-2 -2)"
        />
      </>
    ),
    cursor: <path d="m5 3 14 9-7 1-3 7L5 3Z" />,
    bold: (
      <>
        <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12M6 6l12 12" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sparkles: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.8 1.7L7.5 5.5l-1.7.8L5 8l-.8-1.7L2.5 5.5l1.7-.8L5 3Z" />
      </>
    ),
    code: (
      <>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.grid}
    </svg>
  );
};

function App() {
  const { enabled: authEnabled, user, canEdit, canShare, canPublish, canManageMembers, listMembers, inviteMember, switchWorkspace, signOut, notice: authNotice } = useAuth();
  const workspaceKey = user.workspaceId || user.id;
  const storageKey = `canvas-builder-page:${workspaceKey}`;
  const lastWorkspaceKey = useRef(workspaceKey);
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
        ?? localStorage.getItem(`canvas-builder-page:${user.id}`)
        ?? (!authEnabled ? localStorage.getItem("canvas-builder-page") : null);
      return stored ? (JSON.parse(stored) as Item[]) : initialItems;
    } catch {
      return initialItems;
    }
  });
  const [undoStack, setUndoStack] = useState<Item[][]>([]);
  const [redoStack, setRedoStack] = useState<Item[][]>([]);
  const [selected, setSelected] = useState("title");
  const [tab, setTab] = useState<Tab>("layers");
  const [inspectorTab, setInspectorTab] = useState<"style" | "content">(
    "style",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(true);
  const [modal, setModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState("");
  const [exportModal, setExportModal] = useState(false);
  const [membersModal, setMembersModal] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"editor" | "viewer">("editor");
  const [memberMessage, setMemberMessage] = useState("");
  const [exportTarget, setExportTarget] = useState<"react" | "next">("next");
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState("");
  const selectedId = items.some((item) => item.id === selected)
  ? selected
  : (items[0]?.id ?? "");
const active = items.find((item) => item.id === selectedId) ?? items[0];

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(items));
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [items, storageKey]);

  useEffect(() => {
    if (lastWorkspaceKey.current === workspaceKey) return;
    lastWorkspaceKey.current = workspaceKey;
    let nextItems = initialItems;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) nextItems = JSON.parse(stored) as Item[];
    } catch {
      nextItems = initialItems;
    }
    setItems(nextItems);
    setUndoStack([]);
    setRedoStack([]);
    setSelected("title");
    setTab("layers");
  }, [storageKey, workspaceKey]);

  useEffect(() => {
    if (authNotice) setGenerationNotice(authNotice);
  }, [authNotice]);

  


  const commit = (next: Item[]) => {
    if (!canEdit) return;
    setUndoStack((stack) => [...stack.slice(-29), items]);
    setRedoStack([]);
    setSaved(false);
    setItems(next);
  };
  const generateFromPrompt = async () => {
    if (!canEdit) return;
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setGenerationNotice("");
    try {
      const result = await generatePageFromPrompt(aiPrompt.trim());
      commit(result.items);
      setSelected("title");
      setTab("layers");
      setAiModal(false);
      setGenerationNotice(
        result.mode === "endpoint"
          ? "AI generated a new page from your brief."
          : "Draft created locally. Connect an AI endpoint for model-generated pages.",
      );
    } catch (error) {
      setGenerationNotice(
        error instanceof Error ? error.message : "Could not generate the page.",
      );
    } finally {
      setGenerating(false);
    }
  };
  const update = (
    key: "name" | "text" | "color" | "fontSize",
    value: string | number,
  ) => {
    if (!canEdit) return;
    commit(
      items.map((item) =>
        item.id === selectedId ? { ...item, [key]: value } : item,
      ),
    );
  };
  const undo = () => {
    if (!canEdit) return;
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((stack) => [...stack, items]);
    setUndoStack((stack) => stack.slice(0, -1));
    setItems(previous);
    setSaved(false);
  };
  const redo = () => {
    if (!canEdit) return;
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((stack) => [...stack, items]);
    setRedoStack((stack) => stack.slice(0, -1));
    setItems(next);
    setSaved(false);
  };
  const exportProject = () => {
    const file = new Blob(
      [JSON.stringify({ name: "Untitled website", page: items }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "north-studio.canvas.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const exportCode = () => {
    const pageDocument = createCanvasDocument(items);
    const source = buildPageSource(pageDocument, exportTarget);
    const file = new Blob([source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportTarget === "next" ? "app-page.tsx" : "Page.tsx";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportModal(false);
  };
  const openMembers = async () => {
    setMembersModal(true);
    setMemberMessage("");
    try {
      setMembers(await listMembers());
    } catch (error) {
      setMemberMessage(error instanceof Error ? error.message : "Could not load workspace members.");
    }
  };
  const saveMember = async () => {
    setMemberMessage("");
    try {
      await inviteMember(memberEmail, memberRole);
      setMembers(await listMembers());
      setMemberEmail("");
      setMemberMessage("Appwrite invitation sent. They’ll appear as a member after accepting it.");
    } catch (error) {
      setMemberMessage(error instanceof Error ? error.message : "Could not update access.");
    }
  };
  const addItem = (type: Kind) => {
    if (!canEdit) return;
    const labels: Record<Kind, string> = {
      section: "Section",
      heading: "Heading",
      text: "Text block",
      button: "Button",
      image: "Image",
    };
    const id = `${type}-${new Date()}`;
    const item: Item = {
      id,
      type,
      name: labels[type],
      text:
        type === "heading"
          ? "A fresh idea."
          : type === "button"
            ? "Learn more"
            : type === "image"
              ? "Your image"
              : type === "section"
                ? "New section"
                : "Write something meaningful here.",
      visible: true,
    };
    commit([...items, item]);
    setSelected(id);
    setTab("layers");
  };


const removeItem = () => {
  if (!canEdit) return;
  if (items.length <= 1) return;
  const next = items.filter((item) => item.id !== selectedId);
  commit(next);
  setSelected(next[0]?.id ?? "");
};
  const iconFor = (type: Kind) =>
    type === "heading"
      ? "type"
      : type === "image"
        ? "image"
        : type === "button"
          ? "cursor"
          : type === "section"
            ? "grid"
            : "text";

  return (
    <div className="builder-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span />
          </div>
          <span>
            canvas<span className="brand-dot">.</span>
          </span>
          <span className="brand-divider" />
          <button className="project-name">
            Untitled website <Icon name="chevron" size={14} />
          </button>
        </div>
        <div className="top-center">
          <span className={`save-dot ${saved ? "is-saved" : ""}`} />
          {saved ? "All changes saved" : "Unsaved changes"}
          <span className="top-separator" />{" "}
          <span className="page-path">Home page</span>
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            title="Undo"
            onClick={undo}
            disabled={!canEdit || !undoStack.length}
          >
            <Icon name="undo" size={17} />
          </button>
          <button
            className="icon-button"
            title="Redo"
            onClick={redo}
            disabled={!canEdit || !redoStack.length}
          >
            <Icon name="redo" size={17} />
          </button>
          <span className="top-separator" />
          <button className="share-button" onClick={() => setModal(true)} disabled={!canShare}>
            Share
          </button>
          <button
            className="publish-button"
            disabled={!canPublish}
            onClick={() => {
              setSaved(true);
              setModal(true);
            }}
          >
            <Icon name="check" size={15} /> Publish
          </button>
          <button
            className="avatar account-avatar"
            title={authEnabled ? `Signed in as ${user.email}. Click to sign out.` : "Local preview account"}
            onClick={() => {
              if (authEnabled) void signOut().catch((error: unknown) => {
                setGenerationNotice(error instanceof Error ? error.message : "Could not sign out.");
              });
            }}
          >
            {(user.name?.[0] ?? user.email[0] ?? "M").toUpperCase()}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <button className="rail-button active" title="Builder">
            <Icon name="grid" />
          </button>
          <button
            className="rail-button"
            title="Components"
            onClick={() => setTab("blocks")}
          >
            <Icon name="plus" />
          </button>
          <button
            className="rail-button ai-rail-button"
            title="Generate a website with AI"
            disabled={!canEdit}
            onClick={() => setAiModal(true)}
          >
            <Icon name="sparkles" />
          </button>
          <button className="rail-button" title="Assets">
            <Icon name="image" />
          </button>
          <div className="rail-spacer" />
          <button className="rail-button" title="Settings">
            <Icon name="settings" />
          </button>
          <div className="rail-avatar">M</div>
        </aside>

        <aside className="left-panel">
          <div className="panel-title-row">
            <div>
              <div className="eyebrow-label">WEBSITE</div>
              <h1>
                Pages <span className="page-count">1</span>
              </h1>
            </div>
            <button className="small-icon-button" title="Add page" disabled={!canEdit}>
              <Icon name="plus" size={17} />
            </button>
          </div>
          <button className="page-row active">
            <span className="page-glyph">⌂</span>
            <span>Home page</span>
            <span className="page-row-menu">
              <Icon name="more" size={16} />
            </span>
          </button>
          <div className="panel-tabs">
            <button
              className={tab === "layers" ? "selected" : ""}
              onClick={() => setTab("layers")}
            >
              <Icon name="layers" size={15} /> Layers
            </button>
            <button
              className={tab === "blocks" ? "selected" : ""}
              onClick={() => setTab("blocks")}
            >
              <Icon name="grid" size={15} /> Add blocks
            </button>
          </div>
          {tab === "layers" ? (
            <>
              <div className="searchbox">
                <Icon name="search" size={15} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a layer"
                />
                <kbd>⌘ K</kbd>
              </div>
              <div className="tree-heading">
                <span>HOME PAGE</span>
                <button
                  className="plain-icon"
                  disabled={!canEdit}
                  onClick={() => addItem("section")}
                >
                  <Icon name="plus" size={15} />
                </button>
              </div>
              <div className="layer-list">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    className={`layer-row ${selectedId === item.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelected(item.id);
                      setInspectorTab("style");
                    }}
                  >
                    <span className="layer-caret">
                      {item.type === "section" ? "⌄" : ""}
                    </span>
                    <Icon name={iconFor(item.type)} size={15} />
                    <span className="layer-name">{item.name}</span>
                    <span
                      className={`layer-more ${!canEdit ? "is-disabled" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        commit(
                          items.map((it) =>
                            it.id === item.id
                              ? { ...it, visible: !it.visible }
                              : it,
                          ),
                        );
                      }}
                    >
                      <Icon name={item.visible ? "eye" : "close"} size={14} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="layer-tip">
                <span className="tip-icon">✦</span>
                <span>
                  <b>Tip</b> · Drag layers to reorder your page.
                </span>
              </div>
            </>
          ) : (
            <div className="blocks-content">
              <div className="block-intro">
                Add to your page
                <span>Click a block to add it to the canvas.</span>
              </div>
              <div className="block-grid">
                {(
                  ["section", "heading", "text", "button", "image"] as Kind[]
                ).map((type) => (
                  <button
                    className="block-card"
                    key={type}
                    disabled={!canEdit}
                    onClick={() => addItem(type)}
                  >
                    <span className={`block-icon ${type}`}>
                      <Icon name={iconFor(type)} size={19} />
                    </span>
                    <span>
                      {type === "section"
                        ? "Section"
                        : type === "heading"
                          ? "Heading"
                          : type === "text"
                            ? "Text"
                            : type === "button"
                              ? "Button"
                              : "Image"}
                    </span>
                    <Icon name="plus" size={13} />
                  </button>
                ))}
              </div>
              <div className="block-note">
                More blocks and templates coming soon.
              </div>
            </div>
          )}
          <div className="left-panel-bottom">
            <div className="workspace-user">
              <div className="avatar small">{(user.name?.[0] ?? user.email[0] ?? "M").toUpperCase()}</div>
              <div>
                {authEnabled && user.workspaces.length > 1 ? (
                  <select
                    className="workspace-select"
                    aria-label="Switch workspace"
                    value={user.workspaceId}
                    onChange={(event) => void switchWorkspace(event.target.value).catch((error: unknown) => {
                      setGenerationNotice(error instanceof Error ? error.message : "Could not switch workspace.");
                    })}
                  >
                    {user.workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.role}</option>
                    ))}
                  </select>
                ) : (
                  <b>{authEnabled ? user.workspaceName : "Local preview"}</b>
                )}
                <span>{authEnabled ? `${user.role} · workspace` : "Not signed in"}</span>
              </div>
              <button className="workspace-access-button" disabled={!canManageMembers} title="Manage workspace access" onClick={() => void openMembers()}>
                Access
              </button>
            </div>
          </div>
        </aside>

        <main className="editor-main">
          <div className="canvas-toolbar">
            <div className="canvas-breadcrumb">
              <span>Home page</span>
              <span className="crumb-slash">/</span>
              <span>{active?.name}</span>
            </div>
            <div className="canvas-tools">
              <button
                className={`tool-button ${device === "desktop" ? "tool-selected" : ""}`}
                onClick={() => setDevice("desktop")}
                title="Desktop"
              >
                <Icon name="desktop" size={16} />
              </button>
              <button
                className={`tool-button ${device === "mobile" ? "tool-selected" : ""}`}
                onClick={() => setDevice("mobile")}
                title="Mobile"
              >
                <Icon name="mobile" size={16} />
              </button>
              <span className="tool-divider" />
              <button
                className={`tool-button ${preview ? "tool-selected" : ""}`}
                onClick={() => setPreview(!preview)}
                title="Preview"
              >
                <Icon name="eye" size={17} />
              </button>
              <span className="tool-divider" />
              <button
                className="zoom-control"
                onClick={() =>
                  setZoom((z) => (z === 100 ? 75 : z === 75 ? 50 : 100))
                }
              >
                {zoom}% <Icon name="chevron" size={13} />
              </button>
              <button
                className="tool-button"
                title="Export project JSON"
                onClick={exportProject}
              >
                <Icon name="download" size={16} />
              </button>
              <button
                className="tool-button"
                title="Export React or Next.js code"
                onClick={() => setExportModal(true)}
              >
                <Icon name="code" size={16} />
              </button>
            </div>
          </div>
          <div className="canvas-stage">
            <div
              className={`page-canvas ${device === "mobile" ? "mobile-canvas" : ""} ${preview ? "preview-mode" : ""}`}
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <Canvas
                items={items}
                selectedId={selectedId}
                preview={preview}
                onSelect={(id) => !preview && setSelected(id)}
              />
            </div>
            <div className="canvas-outside-label">
              Designed with{" "}
              <b>
                canvas<span>.</span>
              </b>
            </div>
          </div>
          <div className="bottom-bar">
            <span>
              <span className="online-dot" /> Live canvas
            </span>
            <span>Last saved just now</span>
            <button onClick={() => setSaved(true)}>
              Save now <span>⌘ S</span>
            </button>
          </div>
        </main>

        <aside className="right-panel">
          <div className="inspector-header">
            <div>
              <div className="eyebrow-label">INSPECTOR</div>
              <h2>{active?.name ?? "Selection"}</h2>
            </div>
            <button className="small-icon-button" title="More options">
              <Icon name="more" size={17} />
            </button>
          </div>
          <div className="inspector-tabs">
            <button
              className={inspectorTab === "style" ? "selected" : ""}
              onClick={() => setInspectorTab("style")}
            >
              Style
            </button>
            <button
              className={inspectorTab === "content" ? "selected" : ""}
              onClick={() => setInspectorTab("content")}
            >
              Content
            </button>
          </div>
          {inspectorTab === "style" ? (
            <div className="inspector-body">
              <div className="selection-chip">
                <span className="chip-icon">
                  <Icon name={iconFor(active?.type ?? "heading")} size={14} />
                </span>
                <span>{active?.type ?? "element"}</span>
                <button title="Delete selected element" disabled={!canEdit} onClick={removeItem}>
                  <Icon name="close" size={14} />
                </button>
              </div>
              <section className="inspector-section">
                <div className="section-label">
                  Layout <Icon name="chevron" size={14} />
                </div>
                <div className="control-row">
                  <label>Display</label>
                  <button className="select-control">
                    Flex <Icon name="chevron" size={13} />
                  </button>
                </div>
                <div className="control-row">
                  <label>Direction</label>
                  <div className="segment-control">
                    <button className="chosen">↔</button>
                    <button>↕</button>
                    <button>⊞</button>
                  </div>
                </div>
                <div className="control-row">
                  <label>Align</label>
                  <div className="segment-control">
                    <button>⌜</button>
                    <button className="chosen">⊞</button>
                    <button>⌟</button>
                  </div>
                </div>
              </section>
              <section className="inspector-section">
                <div className="section-label">
                  Spacing <Icon name="chevron" size={14} />
                </div>
                <div className="spacing-diagram">
                  <div className="spacing-label top">24</div>
                  <div className="spacing-inner">
                    <span>16</span>
                    <div className="spacing-center">Content</div>
                    <span>16</span>
                  </div>
                  <div className="spacing-label bottom">24</div>
                </div>
                <div className="control-row">
                  <label>Gap</label>
                  <div className="number-control">
                    12 <span>px</span>
                  </div>
                </div>
              </section>
              <section className="inspector-section">
                <div className="section-label">
                  Typography <Icon name="chevron" size={14} />
                </div>
                <div className="control-row">
                  <label>Font</label>
                  <button className="select-control">
                    DM Sans <Icon name="chevron" size={13} />
                  </button>
                </div>
                <div className="control-row">
                  <label>Size</label>
                  <label className="number-control">
                    <input
                      aria-label="Font size"
                      type="number"
                      min="8"
                      max="144"
                      disabled={!canEdit}
                      value={
                        active?.fontSize ??
                        (active?.type === "heading" ? 72 : 16)
                      }
                      onChange={(e) =>
                        update("fontSize", Number(e.target.value))
                      }
                    />
                    <span>px</span>
                  </label>
                </div>
                <div className="control-row">
                  <label>Weight</label>
                  <button className="select-control">
                    {active?.type === "heading" ? "Medium" : "Regular"}
                    <Icon name="chevron" size={13} />
                  </button>
                </div>
              </section>
              <section className="inspector-section">
                <div className="section-label">
                  Color <Icon name="chevron" size={14} />
                </div>
                <label className="color-field">
                  <input
                    aria-label="Text color"
                    type="color"
                    disabled={!canEdit}
                    value={active?.color ?? "#20231f"}
                    onChange={(e) => update("color", e.target.value)}
                  />
                  <span>{active?.color ?? "#20231f"}</span>
                  <span className="color-opacity">100%</span>
                </label>
              </section>
            </div>
          ) : (
            <div className="inspector-body content-body">
              <label className="field-label">
                Layer name
                <input
                  value={active?.name ?? ""}
                  disabled={!canEdit}
                  onChange={(e) => update("name", e.target.value)}
                />
              </label>
              <label className="field-label">
                {active?.type === "image"
                  ? "Alt text"
                  : active?.type === "button"
                    ? "Button label"
                    : "Text content"}
                <textarea
                  rows={4}
                  value={active?.text ?? ""}
                  disabled={!canEdit}
                  onChange={(e) => update("text", e.target.value)}
                />
              </label>
              <p className="field-help">Changes update the canvas instantly.</p>
            </div>
          )}
          <div className="right-panel-bottom">
            <button className="delete-button" onClick={removeItem}>
              <Icon name="close" size={15} /> Delete element
            </button>
          </div>
        </aside>
      </div>
      {aiModal && (
        <div className="modal-backdrop" onClick={() => !generating && setAiModal(false)}>
          <section
            className="builder-modal ai-builder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-builder-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close AI builder"
              disabled={generating}
              onClick={() => setAiModal(false)}
            >
              <Icon name="close" size={17} />
            </button>
            <div className="modal-mark ai-modal-mark">
              <Icon name="sparkles" size={20} />
            </div>
            <h2 id="ai-builder-title">What should we build?</h2>
            <p>Describe the business, audience, and style. You can edit every layer after the first draft.</p>
            <label className="field-label ai-prompt-label">
              Website brief
              <textarea
                autoFocus
                rows={5}
                placeholder="A warm, modern website for a neighborhood coffee shop…"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    void generateFromPrompt();
                  }
                }}
              />
            </label>
            <div className="ai-connection-note">
              No AI provider is connected yet. This version creates an editable local draft; connect a server endpoint to use a language model.
            </div>
            {generationNotice && aiModal && (
              <p className="ai-error" role="status">{generationNotice}</p>
            )}
            <button
              className="modal-primary ai-generate-button"
              disabled={!aiPrompt.trim() || generating}
              onClick={() => void generateFromPrompt()}
            >
              <Icon name="sparkles" size={15} />
              {generating ? "Building your first draft…" : "Generate website"}
            </button>
          </section>
        </div>
      )}
      {exportModal && (
        <div className="modal-backdrop" onClick={() => setExportModal(false)}>
          <section
            className="builder-modal export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close export options"
              onClick={() => setExportModal(false)}
            >
              <Icon name="close" size={17} />
            </button>
            <div className="eyebrow-label">CODE EXPORT</div>
            <h2 id="export-title">Choose your React setup</h2>
            <p>Download a self-contained, typed page component with responsive base styles.</p>
            <div className="export-options">
              <button
                className={exportTarget === "react" ? "export-option selected" : "export-option"}
                onClick={() => setExportTarget("react")}
              >
                <b>React</b><span>src/Page.tsx</span>
              </button>
              <button
                className={exportTarget === "next" ? "export-option selected" : "export-option"}
                onClick={() => setExportTarget("next")}
              >
                <b>Next.js</b><span>app/page.tsx</span>
              </button>
            </div>
            <button className="modal-primary" onClick={exportCode}>
              <Icon name="download" size={15} /> Download page source
            </button>
          </section>
        </div>
      )}
      {membersModal && (
        <div className="modal-backdrop" onClick={() => setMembersModal(false)}>
          <section className="builder-modal members-modal" role="dialog" aria-modal="true" aria-labelledby="members-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close workspace access" onClick={() => setMembersModal(false)}>
              <Icon name="close" size={17} />
            </button>
            <div className="eyebrow-label">WORKSPACE</div>
            <h2 id="members-title">Manage access</h2>
            <p>People need an account before you can add them to this workspace.</p>
            <div className="member-list">
              {members.map((member) => (
                <div className="member-row" key={member.id}>
                  <span className="member-avatar">{(member.name?.[0] ?? member.email[0]).toUpperCase()}</span>
                  <span className="member-identity"><b>{member.name}</b><small>{member.email}</small></span>
                  <span className="member-role">{member.role}{member.pending ? " · invited" : ""}</span>
                </div>
              ))}
            </div>
            <div className="member-invite">
              <label className="field-label">Account email<input type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="teammate@example.com" /></label>
              <label className="field-label">Permission<select value={memberRole} onChange={(event) => setMemberRole(event.target.value as "editor" | "viewer")}><option value="editor">Editor · can change the page</option><option value="viewer">Viewer · read only</option></select></label>
              <button className="modal-primary" disabled={!memberEmail.trim()} onClick={() => void saveMember()}>Add or update access</button>
            </div>
            {memberMessage && <p className="member-message" role="status">{memberMessage}</p>}
          </section>
        </div>
      )}
      {generationNotice && !aiModal && (
        <div className="builder-toast" role="status">
          <span>{generationNotice}</span>
          <button aria-label="Dismiss message" onClick={() => setGenerationNotice("")}>×</button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="publish-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(false)}>
              <Icon name="close" size={17} />
            </button>
            <div className="modal-mark">
              <Icon name="check" size={20} />
            </div>
            <h2>Your site is ready to share</h2>
            <p>Publish your work to make it available on the web.</p>
            <div className="url-preview">
              <span>north-studio.canvas.site</span>
              <button onClick={() => setSaved(true)}>Copy link</button>
            </div>
            <button
              className="modal-primary"
              onClick={() => {
                setSaved(true);
                setModal(false);
              }}
            >
              Publish website
            </button>
            <span className="modal-footnote">
              You can connect a custom domain any time.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
