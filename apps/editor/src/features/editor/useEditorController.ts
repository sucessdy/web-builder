import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { generatePageFromPrompt } from "../../lib/ai-generator";
import {
  deleteRemotePage,
  listRemotePages,
  saveRemotePage,
  sendAiChat,
  uploadImage,
  type ChatMessage,
} from "../../lib/api-client";
import { buildPageSource, type ExportTarget } from "../../lib/code-export";
import { downloadFile } from "../../lib/download";
import { layerConfig } from "./layer-config";
import { createLayout } from "./layouts/create-layout";
import type { LayoutId } from "./layouts/layout-registry";
import { insertPresets, type InsertPresetId } from "./insert-presets";
import { useWorkspaceAccess } from "./useWorkspaceAccess";
import { useEditorHistory } from "./use-editor-history";
import type { NodeStyles } from "@visual-builder/document-schema";
import {
  layersToPage,
  findLayer,
  findParentLayer,
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
const firstMainHeading = (layers: EditorLayer[]) =>
  flattenLayers(layers).find(
    ({ item }) => item.type === "heading" && item.level === "h1",
  )?.item.id;
const initialSelection =
  firstMainHeading(initialItems) ?? initialItems[0]?.id ?? "";
type EditorPage = { id: string; name: string; items: EditorLayer[] };
type Tab = "layers" | "blocks";
type InspectorTab = "style" | "content";

function readPages(
  key: string,
  userId: string,
  authEnabled: boolean,
): EditorPage[] {
  try {
    const serialized = localStorage.getItem(`canvas-builder-pages:${key}`);
    if (serialized) {
      const value: unknown = JSON.parse(serialized);
      if (Array.isArray(value)) {
        const pages = value.flatMap((page): EditorPage[] => {
          if (
            typeof page !== "object" ||
            page === null ||
            !("id" in page) ||
            !("name" in page) ||
            !("items" in page)
          )
            return [];
          const items = parseSavedLayers(JSON.stringify(page.items));
          return typeof page.id === "string" &&
            typeof page.name === "string" &&
            items
            ? [{ id: page.id, name: page.name, items }]
            : [];
        });
        if (pages.length) return pages;
      }
    }
  } catch {
    /* recover from the existing single-page save below */
  }

  const oldPage =
    localStorage.getItem(`canvas-builder-page:${key}`) ??
    localStorage.getItem(`canvas-builder-page:${userId}`) ??
    (!authEnabled ? localStorage.getItem("canvas-builder-page") : null);
  return [
    {
      id: "home-page",
      name: "Home page",
      items: parseSavedLayers(oldPage) ?? initialItems,
    },
  ];
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
  const [initialPages] = useState(() => readPages(workspaceKey, user.id, authEnabled));
  const [pages, setPages] = useState<EditorPage[]>(initialPages);
  const [activePageId, setActivePageId] = useState(
    () => initialPages[0]?.id ?? "home-page",
  );
  const lastWorkspaceKey = useRef(workspaceKey);
  const [saved, setSaved] = useState(true);
  const onItemsChanged = (next: EditorLayer[]) => {
    setSaved(false);
    setPages((current) => current.map((page) =>
      page.id === activePageId ? { ...page, items: next } : page,
    ));
  };
  const history = useEditorHistory(initialPages[0]?.items ?? initialItems, canEdit, onItemsChanged);
  const { items, undoStack, redoStack, commit, undo, redo, replaceItems } = history;
  const [selected, setSelected] = useState(initialSelection);
  const [tab, setTab] = useState<Tab>("blocks");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("style");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
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
  const selectedId = findLayer(items, selected)
    ? selected
    : (items[0]?.id ?? "");
  const active = findLayer(items, selectedId) ?? items[0];
  const notice =
    localNotice || (authNotice !== dismissedAuthNotice ? authNotice : "");
  const filteredItems = useMemo(
    () =>
      flattenLayers(items).filter(({ item }) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(layersToPage(items)));
      localStorage.setItem(
        `canvas-builder-pages:${workspaceKey}`,
        JSON.stringify(
          pages.map((page) =>
            page.id === activePageId ? { ...page, items } : page,
          ),
        ),
      );
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [activePageId, items, pages, storageKey, workspaceKey]);

  useEffect(() => {
    const currentPage = pages.find((page) => page.id === activePageId);
    if (!currentPage) return;
    const timer = window.setTimeout(() => {
      void saveRemotePage(workspaceKey, {
        id: currentPage.id,
        name: currentPage.name,
        document: layersToPage(items),
      }).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activePageId, items, pages, workspaceKey]);

  useEffect(() => {
    if (lastWorkspaceKey.current === workspaceKey) return;
    lastWorkspaceKey.current = workspaceKey;
    const nextPages = readPages(workspaceKey, user.id, authEnabled);
    setPages(nextPages);
    setActivePageId(nextPages[0]?.id ?? "home-page");
    replaceItems(nextPages[0]?.items ?? initialItems);
    setSelected(initialSelection);
    setTab("layers");
  }, [authEnabled, storageKey, user.id, workspaceKey, replaceItems]);

  useEffect(() => {
    let cancelled = false;
    void listRemotePages(workspaceKey)
      .then((remotePages) => {
        if (cancelled || !remotePages.length) return;
        const restored = remotePages.flatMap((page): EditorPage[] => {
          const items = parseSavedLayers(JSON.stringify(page.document));
          return items ? [{ id: page.id, name: page.name, items }] : [];
        });
        if (!restored.length) return;
        setPages((localPages) => {
          const byId = new Map(restored.map((page) => [page.id, page]));
          localPages.forEach((page) => {
            if (!byId.has(page.id)) byId.set(page.id, page);
          });
          return [...byId.values()];
        });
        if (
          activePageId === "home-page" &&
          items.length === initialItems.length
        ) {
          setActivePageId(restored[0].id);
          replaceItems(restored[0].items);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // Load backend pages once on mount; workspace switching uses the local workspace copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceKey, replaceItems]);

  const setNotice = (message: string) => setLocalNotice(message);
  const dismissNotice = () => {
    setLocalNotice("");
    setDismissedAuthNotice(authNotice);
  };

  const generateFromPrompt = async () => {
    if (!canEdit || !aiPrompt.trim()) return;
    setGenerating(true);
    setNotice("");
    try {
      const result = await generatePageFromPrompt(aiPrompt.trim());
      const page: EditorPage = {
        id: `page-${crypto.randomUUID()}`,
        name:
          aiPrompt
            .trim()
            .replace(/[.!?].*$/, "")
            .slice(0, 45) || "Generated page",
        items: result.items,
      };
      setPages((current) => [
        ...current.map((item) =>
          item.id === activePageId ? { ...item, items } : item,
        ),
        page,
      ]);
      setActivePageId(page.id);
      replaceItems(result.items);
      setSaved(false);
      setSelected(firstMainHeading(result.items) ?? result.items[0]?.id ?? "");
      setTab("layers");
      setAiOpen(false);
      setNotice("AI generated a new page from your brief.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not generate the page.",
      );
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
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not reach the AI assistant.",
      );
    } finally {
      setChatSending(false);
    }
  };

  const update = (
    key: "name" | "text" | "color" | "fontSize" | "level" | "styles",
    value: string | number | NodeStyles,
  ) => {
    if (!canEdit) return;
    commit(
      updateLayerTree(items, selectedId, (item) => {
        if (key !== "text" || item.type !== "section")
          return { ...item, [key]: value };
        let updatedFirstText = false;
        const children = item.children?.map((child) => {
          if (!updatedFirstText && child.type === "text") {
            updatedFirstText = true;
            return { ...child, text: String(value) };
          }
          return child;
        });
        return { ...item, text: String(value), children };
      }),
    );
  };

  const updateStyle = (
    key: keyof NodeStyles,
    value: NodeStyles[keyof NodeStyles],
  ) => {
    if (!canEdit) return;
    update("styles", { ...active?.styles, [key]: value });
  };

  const exportProject = () =>
    downloadFile(
      JSON.stringify(layersToPage(items), null, 2),
      "north-studio.canvas.json",
      "application/json",
    );

  const exportCode = () => {
    const source = buildPageSource(layersToPage(items), exportTarget);
    downloadFile(
      source,
      exportTarget === "next" ? "app-page.tsx" : "Page.tsx",
      "text/plain;charset=utf-8",
    );
    setExportOpen(false);
  };

  const saveNow = () => {
    localStorage.setItem(storageKey, JSON.stringify(layersToPage(items)));
    localStorage.setItem(
      `canvas-builder-pages:${workspaceKey}`,
      JSON.stringify(
        pages.map((page) =>
          page.id === activePageId ? { ...page, items } : page,
        ),
      ),
    );
    const activePage = pages.find((page) => page.id === activePageId);
    if (activePage)
      void saveRemotePage(workspaceKey, {
        id: activePage.id,
        name: activePage.name,
        document: layersToPage(items),
      }).catch(() => undefined);
    setSaved(true);
  };

  const switchPage = (id: string) => {
    const target = pages.find((page) => page.id === id);
    if (!target || target.id === activePageId) return;
    setPages((current) =>
      current.map((page) =>
        page.id === activePageId ? { ...page, items } : page,
      ),
    );
    setActivePageId(target.id);
    replaceItems(target.items);
    setSelected(firstMainHeading(target.items) ?? target.items[0]?.id ?? "");
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
    setPages((current) => [
      ...current.map((item) =>
        item.id === activePageId ? { ...item, items } : item,
      ),
      page,
    ]);
    setActivePageId(page.id);
    replaceItems(page.items);
    setSelected("");
    setSaved(false);
    setTab("layers");
  };

  const renamePage = (id: string, name: string) => {
    const safeName = name.trim().slice(0, 60);
    if (!canEdit || !safeName) return;
    setPages((current) =>
      current.map((page) =>
        page.id === id ? { ...page, name: safeName } : page,
      ),
    );
    setSaved(false);
  };

  const duplicatePage = (id: string) => {
    if (!canEdit) return;
    const source = pages.find((page) => page.id === id);
    if (!source) return;
    const duplicate: EditorPage = {
      id: `page-${crypto.randomUUID()}`,
      name: `${source.name} copy`.slice(0, 60),
      items: source.id === activePageId ? items : source.items,
    };
    setPages((current) => [
      ...current.map((page) => page.id === activePageId ? { ...page, items } : page),
      duplicate,
    ]);
    setActivePageId(duplicate.id);
    replaceItems(duplicate.items);
    setSelected(firstMainHeading(duplicate.items) ?? duplicate.items[0]?.id ?? "");
    setSearch("");
    setSaved(false);
    setTab("layers");
  };

  const deletePage = (id: string) => {
    if (!canEdit || pages.length <= 1) return;
    const pageIndex = pages.findIndex((page) => page.id === id);
    if (pageIndex < 0) return;
    const remaining = pages
      .map((page) => page.id === activePageId ? { ...page, items } : page)
      .filter((page) => page.id !== id);
    setPages(remaining);
    void deleteRemotePage(workspaceKey, id).catch(() => undefined);
    if (id === activePageId) {
      const nextPage = remaining[Math.min(pageIndex, remaining.length - 1)] ?? remaining[0];
      setActivePageId(nextPage.id);
      replaceItems(nextPage.items);
      setSelected(firstMainHeading(nextPage.items) ?? nextPage.items[0]?.id ?? "");
      setSearch("");
    }
    setSaved(false);
  };

  const addItem = (type: LayerType) => {
    if (!canEdit) return;
    const id = `${type}-${crypto.randomUUID()}`;
    const newItem: EditorLayer = {
      id,
      type,
      name: layerConfig[type].label,
      text: layerConfig[type].defaultText,
      visible: true,
      styles: layerConfig[type].styles,
      children: type === "section" ? [] : undefined,
    };
    const selectedLayer = findLayer(items, selectedId);
    const selectedParent = findParentLayer(items, selectedId);
    const insertionTarget =
      selectedLayer?.type === "section"
        ? selectedLayer
        : selectedParent?.type === "section"
          ? selectedParent
          : undefined;
    const next = insertionTarget
      ? updateLayerTree(items, insertionTarget.id, (layer) => ({
          ...layer,
          children: [...(layer.children ?? []), newItem],
        }))
      : [...items, newItem];
    commit(next);
    setSelected(id);
    setSearch("");
    setTab("layers");
  };

  const addInsertPreset = (presetId: InsertPresetId) => {
    if (!canEdit) return;
    const preset = insertPresets.find(({ id }) => id === presetId);
    if (!preset) return;
    const id = `${preset.id}-${crypto.randomUUID()}`;
    const item: EditorLayer = {
      id,
      type: preset.type,
      name: preset.label,
      text: preset.text,
      visible: true,
      href: preset.href,
      variant: preset.variant,
      styles: preset.styles,
    };
    const selectedLayer = findLayer(items, selectedId);
    const selectedParent = findParentLayer(items, selectedId);
    const insertionTarget =
      selectedLayer?.type === "section"
        ? selectedLayer
        : selectedParent?.type === "section"
          ? selectedParent
          : undefined;
    const next = insertionTarget
      ? updateLayerTree(items, insertionTarget.id, (layer) => ({
          ...layer,
          children: [...(layer.children ?? []), item],
        }))
      : [...items, item];
    commit(next);
    setSelected(id);
    setSearch("");
    setTab("layers");
  };

  const addLayout = (layoutType: LayoutId) => {
    if (!canEdit) return;
    const id = `${layoutType}-${crypto.randomUUID()}`;
    const { layer, selectedId: initialSelectedId } = createLayout(layoutType, id);
    commit([...items, layer]);
    setSelected(initialSelectedId);
    setSearch("");
    setTab("layers");
  };

  const addAsset = async (file: File) => {
    if (!canEdit) return;
    try {
      const src = await uploadImage(file);
      const selectedLayer = findLayer(items, selectedId);
      if (selectedLayer?.type === "image") {
        commit(
          updateLayerTree(items, selectedId, (item) => ({
            ...item,
            src,
            text: file.name,
          })),
        );
        return;
      }
      const id = `image-${crypto.randomUUID()}`;
      const image: EditorLayer = {
        id,
        type: "image",
        name: file.name,
        text: file.name,
        src,
        visible: true,
      };
      const selectedParent = findParentLayer(items, selectedId);
      const insertionTarget =
        selectedLayer?.type === "section"
          ? selectedLayer
          : selectedParent?.type === "section"
            ? selectedParent
            : undefined;
      const next = insertionTarget
        ? updateLayerTree(items, insertionTarget.id, (layer) => ({
            ...layer,
            children: [...(layer.children ?? []), image],
          }))
        : [...items, image];
      commit(next);
      setSelected(id);
      setTab("layers");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not load the image.",
      );
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
    commit(
      updateLayerTree(items, id, (current) => ({
        ...current,
        visible: !current.visible,
      })),
    );
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
    activePageName:
      pages.find((page) => page.id === activePageId)?.name ?? "Home page",
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
    duplicatePage,
    deletePage,
    addItem,
    addInsertPreset,
    addLayout,
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
