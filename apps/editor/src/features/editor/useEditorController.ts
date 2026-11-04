import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { createCanvasDocument } from "../canvas/canvas-document";
import { generatePageFromPrompt } from "../../lib/ai-generator";
import { listRemotePages, saveRemotePage, sendAiChat, uploadImage, type ChatMessage } from "../../lib/api-client";
import { buildPageSource, type ExportTarget } from "../../lib/code-export";
import { downloadFile } from "../../lib/download";
import { layerConfig } from "./layer-config";
import { useWorkspaceAccess } from "./useWorkspaceAccess";
import type { NodeStyles } from "@visual-builder/document-schema";
import {
  layersToPage,
  findLayer,
  flattenLayers,
  removeLayerTree,
  updateLayerTree,
  pageTemplate,
  pageToLayers,
  parseSavedLayers,
  type EditorLayer,
  type LayerType,
} from "../../lib/page-model";

const initialItems = pageToLayers(pageTemplate);
const firstMainHeading = (layers: EditorLayer[]) => flattenLayers(layers).find(({ item }) => item.type === "heading" && item.level === "h1")?.item.id;
const initialSelection = firstMainHeading(initialItems) ?? initialItems[0]?.id ?? "";
type EditorPage = { id: string; name: string; items: EditorLayer[] };
type Tab = "layers" | "blocks";
type InspectorTab = "style" | "content";

function readPages(key: string, userId: string, authEnabled: boolean): EditorPage[] {
  try {
    const serialized = localStorage.getItem(`canvas-builder-pages:${key}`);
    if (serialized) {
      const value: unknown = JSON.parse(serialized);
      if (Array.isArray(value)) {
        const pages = value.flatMap((page): EditorPage[] => {
          if (typeof page !== "object" || page === null || !("id" in page) || !("name" in page) || !("items" in page)) return [];
          const items = parseSavedLayers(JSON.stringify(page.items));
          return typeof page.id === "string" && typeof page.name === "string" && items
            ? [{ id: page.id, name: page.name, items }]
            : [];
        });
        if (pages.length) return pages;
      }
    }
  } catch { /* recover from the existing single-page save below */ }

  const oldPage = localStorage.getItem(`canvas-builder-page:${key}`)
    ?? localStorage.getItem(`canvas-builder-page:${userId}`)
    ?? (!authEnabled ? localStorage.getItem("canvas-builder-page") : null);
  return [{ id: "home-page", name: "Home page", items: parseSavedLayers(oldPage) ?? initialItems }];
}

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
  const [pages, setPages] = useState<EditorPage[]>(() => readPages(workspaceKey, user.id, authEnabled));
  const [activePageId, setActivePageId] = useState(() => readPages(workspaceKey, user.id, authEnabled)[0]?.id ?? "home-page");
  const lastWorkspaceKey = useRef(workspaceKey);
  const [items, setItems] = useState<EditorLayer[]>(() => {
    return readPages(workspaceKey, user.id, authEnabled)[0]?.items ?? initialItems;
  });
  const [undoStack, setUndoStack] = useState<EditorLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorLayer[][]>([]);
  const [selected, setSelected] = useState(initialSelection);
  const [tab, setTab] = useState<Tab>("blocks");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("style");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [localNotice, setLocalNotice] = useState("");
  const [dismissedAuthNotice, setDismissedAuthNotice] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTarget>("next");
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState("");
  const selectedId = findLayer(items, selected) ? selected : (items[0]?.id ?? "");
  const active = findLayer(items, selectedId) ?? items[0];
  const notice = localNotice || (authNotice !== dismissedAuthNotice ? authNotice : "");
  const filteredItems = useMemo(
    () => flattenLayers(items).filter(({ item }) => item.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(layersToPage(items)));
      localStorage.setItem(`canvas-builder-pages:${workspaceKey}`, JSON.stringify(pages.map((page) =>
        page.id === activePageId ? { ...page, items } : page,
      )));
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [activePageId, items, pages, storageKey, workspaceKey]);

  useEffect(() => {
    const currentPage = pages.find((page) => page.id === activePageId);
    if (!currentPage) return;
    const timer = window.setTimeout(() => {
      void saveRemotePage(workspaceKey, { id: currentPage.id, name: currentPage.name, document: layersToPage(items) })
        .catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activePageId, items, pages, workspaceKey]);

  useEffect(() => {
    if (lastWorkspaceKey.current === workspaceKey) return;
    lastWorkspaceKey.current = workspaceKey;
    const nextPages = readPages(workspaceKey, user.id, authEnabled);
    setPages(nextPages);
    setActivePageId(nextPages[0]?.id ?? "home-page");
    setItems(nextPages[0]?.items ?? initialItems);
    setUndoStack([]);
    setRedoStack([]);
    setSelected(initialSelection);
    setTab("layers");
  }, [authEnabled, storageKey, user.id, workspaceKey]);

  useEffect(() => {
    let cancelled = false;
    void listRemotePages(workspaceKey).then((remotePages) => {
      if (cancelled || !remotePages.length) return;
      const restored = remotePages.flatMap((page): EditorPage[] => {
        const items = parseSavedLayers(JSON.stringify(page.document));
        return items ? [{ id: page.id, name: page.name, items }] : [];
      });
      if (!restored.length) return;
      setPages((localPages) => {
        const byId = new Map(restored.map((page) => [page.id, page]));
        localPages.forEach((page) => { if (!byId.has(page.id)) byId.set(page.id, page); });
        return [...byId.values()];
      });
      if (activePageId === "home-page" && items.length === initialItems.length) {
        setActivePageId(restored[0].id);
        setItems(restored[0].items);
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  // Load backend pages once on mount; workspace switching uses the local workspace copy.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceKey]);

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
    setPages((current) => current.map((page) => page.id === activePageId ? { ...page, items: next } : page));
  };

  const generateFromPrompt = async () => {
    if (!canEdit || !aiPrompt.trim()) return;
    setGenerating(true);
    setNotice("");
    try {
      const result = await generatePageFromPrompt(aiPrompt.trim());
      const page: EditorPage = {
        id: `page-${crypto.randomUUID()}`,
        name: aiPrompt.trim().replace(/[.!?].*$/, "").slice(0, 45) || "Generated page",
        items: result.items,
      };
      setPages((current) => [...current.map((item) => item.id === activePageId ? { ...item, items } : item), page]);
      setActivePageId(page.id);
      setItems(result.items);
      setUndoStack([]);
      setRedoStack([]);
      setSaved(false);
    setSelected(firstMainHeading(result.items) ?? result.items[0]?.id ?? "");
      setTab("layers");
      setAiOpen(false);
      setNotice("AI generated a new page from your brief.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate the page.");
    } finally {
      setGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    const content = chatInput.trim();
    if (!canEdit || !content || chatSending) return;
    const nextMessages = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);
    setNotice("");
    try {
      const reply = await sendAiChat(nextMessages);
      setChatMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not reach the AI assistant.");
    } finally {
      setChatSending(false);
    }
  };

  const update = (key: "name" | "text" | "color" | "fontSize" | "level" | "styles", value: string | number | NodeStyles) => {
    if (!canEdit) return;
    commit(updateLayerTree(items, selectedId, (item) => {
      if (key !== "text" || item.type !== "section") return { ...item, [key]: value };
      let updatedFirstText = false;
      const children = item.children?.map((child) => {
        if (!updatedFirstText && child.type === "text") {
          updatedFirstText = true;
          return { ...child, text: String(value) };
        }
        return child;
      });
      return { ...item, text: String(value), children };
    }));
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
    setPages((current) => current.map((page) => page.id === activePageId ? { ...page, items: previous } : page));
    setSaved(false);
  };

  const redo = () => {
    if (!canEdit) return;
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((stack) => [...stack, items]);
    setRedoStack((stack) => stack.slice(0, -1));
    setItems(next);
    setPages((current) => current.map((page) => page.id === activePageId ? { ...page, items: next } : page));
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
    localStorage.setItem(`canvas-builder-pages:${workspaceKey}`, JSON.stringify(pages.map((page) =>
      page.id === activePageId ? { ...page, items } : page,
    )));
    const activePage = pages.find((page) => page.id === activePageId);
    if (activePage) void saveRemotePage(workspaceKey, { id: activePage.id, name: activePage.name, document: layersToPage(items) }).catch(() => undefined);
    setSaved(true);
  };

  const switchPage = (id: string) => {
    const target = pages.find((page) => page.id === id);
    if (!target || target.id === activePageId) return;
    setPages((current) => current.map((page) => page.id === activePageId ? { ...page, items } : page));
    setActivePageId(target.id);
    setItems(target.items);
    setSelected(firstMainHeading(target.items) ?? target.items[0]?.id ?? "");
    setUndoStack([]);
    setRedoStack([]);
    setSearch("");
    setSaved(true);
  };

  const addPage = () => {
    if (!canEdit) return;
    const pageNumber = pages.length + 1;
    const page: EditorPage = {
      id: `page-${crypto.randomUUID()}`,
      name: pageNumber === 2 ? "Untitled page" : `Page ${pageNumber}`,
      items: [],
    };
    setPages((current) => [...current.map((item) => item.id === activePageId ? { ...item, items } : item), page]);
    setActivePageId(page.id);
    setItems(page.items);
    setSelected("");
    setUndoStack([]);
    setRedoStack([]);
    setSaved(false);
    setTab("layers");
  };

  const renamePage = (id: string, name: string) => {
    const safeName = name.trim().slice(0, 60);
    if (!canEdit || !safeName) return;
    setPages((current) => current.map((page) => page.id === id ? { ...page, name: safeName } : page));
    setSaved(false);
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
      styles: layerConfig[type].styles,
    }]);
    setSelected(id);
    setTab("layers");
  };

  const addAsset = async (file: File) => {
    if (!canEdit) return;
    try {
      const src = await uploadImage(file);
      const selectedLayer = findLayer(items, selectedId);
      if (selectedLayer?.type === "image") {
        commit(updateLayerTree(items, selectedId, (item) => ({ ...item, src, text: file.name })));
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
    if (!canEdit || !findLayer(items, selectedId)) return;
    const next = removeLayerTree(items, selectedId);
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

  const toggleVisibility = (id: string) => {
    const layer = findLayer(items, id);
    if (!layer) return;
    commit(updateLayerTree(items, id, (current) => ({ ...current, visible: !current.visible })));
  };

  const loadDemoSite = () => {
    if (!canEdit) return;
    commit(initialItems);
    setSelected(initialSelection);
    setTab("layers");
    setNotice("Loaded the Zephyr AI demo website. Edit any layer or style.");
  };

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
    pages,
    activePageId,
    activePageName: pages.find((page) => page.id === activePageId)?.name ?? "Home page",
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
    chatMessages,
    chatInput,
    setChatInput,
    chatSending,
    sendChatMessage,
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
    switchPage,
    addPage,
    renamePage,
    addItem,
    addAsset,
    removeItem,
    reorderItems,
    selectItem,
    toggleVisibility,
    loadDemoSite,
    iconFor,
    ...workspaceAccess,
  };
}
