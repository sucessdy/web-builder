import { useCallback, useMemo, useRef, useState } from "react";
import { createEditorEngine } from "@visual-builder/editor-engine";
import type { PageDocument } from "@visual-builder/document-schema";
import {
  layersToPage,
  pageToLayers,
  type EditorLayer,
} from "../../lib/page-model";

type Engine = ReturnType<typeof createEditorEngine>;

export function useEditorEngine(
  initialItems: EditorLayer[],
  canEdit: boolean,
  onItemsChanged: (items: EditorLayer[]) => void,
  onInvalidDocument: (error: unknown) => void,
) {
  const engineRef = useRef<Engine | null>(null);
 // eslint-disable-next-line
  if (!engineRef.current) {
    engineRef.current = createEditorEngine(layersToPage(initialItems));
  }
  const [engine ]= useState<Engine>(() =>  createEditorEngine(layersToPage(initialItems))) ; 

  const [document, setDocument] = useState<PageDocument>(
  () => engine.getDocument());

  const [historyVersion, setHistoryVersion] = useState(0);
  const items = useMemo(() => pageToLayers(document), [document]);

  const syncDocument = useCallback((nextDocument: PageDocument) => {
    setDocument(nextDocument);
    setHistoryVersion((version) => version + 1);
  }, []);

  const publishDocument = useCallback((nextDocument: PageDocument) => {
    syncDocument(nextDocument);
    onItemsChanged(pageToLayers(nextDocument));
  }, [onItemsChanged, syncDocument]);

  const commit = useCallback((nextItems: EditorLayer[]) => {
    if (!canEdit) return;
    try {
      engine.dispatch({
        type: "REPLACE_DOCUMENT",
        document: layersToPage(nextItems),
      });
      publishDocument(engine.getDocument());
    } catch (error) {
      onInvalidDocument(error);
    }
  }, [canEdit, engine, onInvalidDocument, publishDocument]);

  const undo = useCallback(() => {
    if (!canEdit) return;
    publishDocument(engine.undo());
  }, [canEdit, engine, publishDocument]);

  const redo = useCallback(() => {
    if (!canEdit) return;
    publishDocument(engine.redo());
  }, [canEdit, engine, publishDocument]);

  const replaceItems = useCallback((nextItems: EditorLayer[]) => {
    try {
      syncDocument(engine.replaceDocument(layersToPage(nextItems)));
    } catch (error) {
      onInvalidDocument(error);
    }
  }, [engine, onInvalidDocument, syncDocument]);

  // Reading counts during render makes history toolbar state follow engine updates.
  void historyVersion;

  return {
    items,
    undoCount: engine.getUndoCount(),
    redoCount: engine.getRedoCount(),
    commit,
    undo,
    redo,
    replaceItems,
  };
}
