import { useCallback, useState } from "react";
import type { EditorLayer } from "../../lib/page-model";

export function useEditorHistory(
  initialItems: EditorLayer[],
  canEdit: boolean,
  onItemsChanged: (items: EditorLayer[]) => void,
) {
  const [items, setItems] = useState(initialItems);
  const [undoStack, setUndoStack] = useState<EditorLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorLayer[][]>([]);

  const commit = useCallback((next: EditorLayer[]) => {
    if (!canEdit) return;
    setUndoStack((stack) => [...stack.slice(-29), items]);
    setRedoStack([]);
    setItems(next);
    onItemsChanged(next);
  }, [canEdit, items, onItemsChanged]);

  const undo = useCallback(() => {
    if (!canEdit) return;
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((stack) => [...stack, items]);
    setUndoStack((stack) => stack.slice(0, -1));
    setItems(previous);
    onItemsChanged(previous);
  }, [canEdit, items, onItemsChanged, undoStack]);

  const redo = useCallback(() => {
    if (!canEdit) return;
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((stack) => [...stack, items]);
    setRedoStack((stack) => stack.slice(0, -1));
    setItems(next);
    onItemsChanged(next);
  }, [canEdit, items, onItemsChanged, redoStack]);

  const replaceItems = useCallback((next: EditorLayer[]) => {
    setItems(next);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return { items, undoStack, redoStack, commit, undo, redo, replaceItems };
}
