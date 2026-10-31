import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { createCanvasDocument } from "../canvas/canvas-document";
import { generatePageFromPrompt } from "../../lib/ai-generator";
import { buildPageSource, type ExportTarget } from "../../lib/code-export";
import { downloadFile } from "../../lib/download";
import { readImageFile } from "../../lib/read-image-file";
import { layerConfig } from "./layer-config";
import { useWorkspaceAccess } from "./useWorkspaceAccess";
import type { NodeStyles } from "@visual-builder/document-schema";
import {
  layersToPage,
  pageTemplate,
  pageToLayers,
  parseSavedLayers,
  type EditorLayer,
  type LayerType,
} from "../../lib/page-model";

const initialItems = pageToLayers(pageTemplate);
const initialSelection = initialItems.find((item) => item.type === "heading")?.id ?? initialItems[0]?.id ?? "";
type Tab = "layers" | "blocks";
type InspectorTab = "style" | "content";

export function useEditorController() {
  const auth = useAuth();
  const {
    enabled: authEnabled,
    user,
    canEdit,
    canShare,
    canPublish,
    canManageMembers,
    listMembers,
    inviteMember,
    switchWorkspace,
    signOut,
    notice: authNotice,
  } = auth;
  const workspaceAccess = useWorkspaceAccess({ listMembers, inviteMember });
  const workspaceKey = user.workspaceId || user.id;
  const storageKey = `canvas-builder-page:${workspaceKey}`;
  const lastWorkspaceKey = useRef(workspaceKey);
  const [items, setItems] = useState<EditorLayer[]>(() => {
    const saved = localStorage.getItem(storageKey)
      ?? localStorage.getItem(`canvas-builder-page:${user.id}`)
      ?? (!authEnabled ? localStorage.getItem("canvas-builder-page") : null);
    return parseSavedLayers(saved) ?? initialItems;
  });
  const [undoStack, setUndoStack] = useState<EditorLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorLayer[][]>([]);
  const [selected, setSelected] = useState(initialSelection);
  const [tab, setTab] = useState<Tab>("layers");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("style");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [localNotice, setLocalNotice] = useState("");
  const [dismissedAuthNotice, setDismissedAuthNotice] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTarget>("next");
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState("");
  const selectedId = items.some((item) => item.id === selected) ? selected : (items[0]?.id ?? "");
  const active = items.find((item) => item.id === selectedId) ?? items[0];
  const notice = localNotice || (authNotice !== dismissedAuthNotice ? authNotice : "");
  const filteredItems = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(layersToPage(items)));
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [items, storageKey]);

  useEffect(() => {
    if (lastWorkspaceKey.current === workspaceKey) return;
    lastWorkspaceKey.current = workspaceKey;
    setItems(parseSavedLayers(localStorage.getItem(storageKey)) ?? initialItems);
    setUndoStack([]);
    setRedoStack([]);
    setSelected(initialSelection);
    setTab("layers");
  }, [storageKey, workspaceKey]);

  const setNotice = (message: string) => setLocalNotice(message);
  const dismissNotice = () => {
    setLocalNotice("");
    setDismissedAuthNotice(authNotice);
  };

  const commit = (next: EditorLayer[]) => {
    if (!canEdit) return;
    setUndoStack((stack) => [...stack.slice(-29), items]);
    setRedoStack([]);
    setSaved(false);
    setItems(next);
  };

  const generateFromPrompt = async () => {
    if (!canEdit || !aiPrompt.trim()) return;
    setGenerating(true);
    setNotice("");
    try {
      const result = await generatePageFromPrompt(aiPrompt.trim());
      commit(result.items);
      setSelected(initialSelection);
      setTab("layers");
      setAiOpen(false);
      setNotice(result.mode === "endpoint"
        ? "AI generated a new page from your brief."
        : "Draft created locally. Connect an AI endpoint for model-generated pages.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate the page.");
    } finally {
      setGenerating(false);
    }
  };

  const update = (key: "name" | "text" | "color" | "fontSize" | "styles", value: string | number | NodeStyles) => {
    if (!canEdit) return;
    commit(items.map((item) => item.id === selectedId ? { ...item, [key]: value } : item));
  };

  const updateStyle = (key: keyof NodeStyles, value: NodeStyles[keyof NodeStyles]) => {
    if (!canEdit) return;
    update("styles", { ...active?.styles, [key]: value });
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

  const exportProject = () => downloadFile(
    JSON.stringify(layersToPage(items), null, 2),
    "north-studio.canvas.json",
    "application/json",
  );

  const exportCode = () => {
    const source = buildPageSource(createCanvasDocument(items), exportTarget);
    downloadFile(source, exportTarget === "next" ? "app-page.tsx" : "Page.tsx", "text/plain;charset=utf-8");
    setExportOpen(false);
  };

  const saveNow = () => {
    localStorage.setItem(storageKey, JSON.stringify(layersToPage(items)));
    setSaved(true);
  };

  const addItem = (type: LayerType) => {
    if (!canEdit) return;
    const id = `${type}-${crypto.randomUUID()}`;
    commit([...items, {
      id,
      type,
      name: layerConfig[type].label,
      text: layerConfig[type].defaultText,
      visible: true,
    }]);
    setSelected(id);
    setTab("layers");
  };

  const addAsset = async (file: File) => {
    if (!canEdit) return;
    try {
      const src = await readImageFile(file);
      const selectedLayer = items.find((item) => item.id === selectedId);
      if (selectedLayer?.type === "image") {
        commit(items.map((item) => item.id === selectedId ? { ...item, src, text: file.name } : item));
        return;
      }
      const id = `image-${crypto.randomUUID()}`;
      commit([...items, { id, type: "image", name: file.name, text: file.name, src, visible: true }]);
      setSelected(id);
      setTab("layers");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load the image.");
    }
  };

  const removeItem = () => {
    if (!canEdit || items.length <= 1) return;
    const next = items.filter((item) => item.id !== selectedId);
    commit(next);
    setSelected(next[0]?.id ?? "");
  };

  const reorderItems = (draggedId: string, targetId: string) => {
    if (!canEdit || draggedId === targetId) return;
    const next = [...items];
    const draggedIndex = next.findIndex((item) => item.id === draggedId);
    const targetIndex = next.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;
    const [draggedItem] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, draggedItem);
    commit(next);
  };

  const selectItem = (id: string) => setSelected(id);

  const iconFor = (type: LayerType) => layerConfig[type].icon;

  return {
    authEnabled,
    user,
    canEdit,
    canShare,
    canPublish,
    canManageMembers,
    switchWorkspace,
    signOut,
    items,
    setItems,
    undoStack,
    redoStack,
    selectedId,
    active,
    tab,
    setTab,
    inspectorTab,
    setInspectorTab,
    device,
    setDevice,
    preview,
    setPreview,
    saved,
    setSaved,
    publishOpen,
    setPublishOpen,
    aiOpen,
    setAiOpen,
    aiPrompt,
    setAiPrompt,
    generating,
    notice,
    setNotice,
    dismissNotice,
    exportOpen,
    setExportOpen,
    exportTarget,
    setExportTarget,
    zoom,
    setZoom,
    search,
    setSearch,
    filteredItems,
    commit,
    generateFromPrompt,
    update,
    updateStyle,
    undo,
    redo,
    exportProject,
    exportCode,
    saveNow,
    addItem,
    addAsset,
    removeItem,
    reorderItems,
    selectItem,
    iconFor,
    ...workspaceAccess,
  };
}
