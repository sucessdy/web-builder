import { useCallback, useMemo, useRef, useState } from "react";
import {
  createEditorEngine,
  type EditorCommand,
} from "@visual-builder/editor-engine";
import type { PageDocument, PageNode } from "@visual-builder/document-schema";
import {
  layersToPage,
  pageToLayers,
  type EditorLayer,
} from "../../lib/page-model";

type Engine = ReturnType<typeof createEditorEngine>;

function indexNodes(document: PageDocument) {
  const nodes = new Map<string, PageNode>();
  const parents = new Map<string, string>();

  const visit = (node: PageNode) => {
    nodes.set(node.id, node);
    node.children.forEach((child) => {
      parents.set(child.id, node.id);
      visit(child);
    });
  };
  visit(document.root);
  return { nodes, parents };
}

function createNodeCommands(current: PageDocument, next: PageDocument): EditorCommand[] {
  const before = indexNodes(current);
  const after = indexNodes(next);
  const commands: EditorCommand[] = [];

  // Add new structure first, leaving existing descendants for explicit moves.
  const newNodeSkeleton = (node: PageNode): PageNode => ({
    ...node,
    children: node.children
      .filter((child) => !before.nodes.has(child.id))
      .map(newNodeSkeleton),
  });
  for (const [id, node] of after.nodes) {
    if (id === next.root.id || before.nodes.has(id)) continue;
    const parentId = after.parents.get(id);
    if (parentId && before.nodes.has(parentId)) {
      commands.push({ type: "ADD_NODE", parentId, node: newNodeSkeleton(node) });
    }
  }

  // Reparent retained nodes before deleting their previous parents.
  for (const [id] of after.nodes) {
    const oldParentId = before.parents.get(id);
    const nextParentId = after.parents.get(id);
    if (
      oldParentId && nextParentId && oldParentId !== nextParentId &&
      before.nodes.has(id)
    ) {
      commands.push({ type: "MOVE_NODE", nodeId: id, parentId: nextParentId });
    }
  }

  // Delete only the highest removed node in each removed subtree.
  for (const [id] of before.nodes) {
    if (id === current.root.id || after.nodes.has(id)) continue;
    const parentId = before.parents.get(id);
    if (parentId && after.nodes.has(parentId)) {
      commands.push({ type: "DELETE_NODE", nodeId: id });
    }
  }

  for (const [id, node] of after.nodes) {
    const oldNode = before.nodes.get(id);
    if (!oldNode) continue;
    if (JSON.stringify(oldNode.props) !== JSON.stringify(node.props)) {
      commands.push({ type: "REPLACE_PROPS", nodeId: id, props: node.props });
    }
    if (JSON.stringify(oldNode.styles) !== JSON.stringify(node.styles)) {
      commands.push({ type: "REPLACE_STYLES", nodeId: id, styles: node.styles });
    }
    if (oldNode.name !== node.name || oldNode.visible !== node.visible) {
      commands.push({
        type: "UPDATE_NODE_META",
        nodeId: id,
        name: node.name,
        visible: node.visible,
      });
    }
  }

  // Reorder siblings after additions and deletions have established membership.
  for (const [parentId, node] of after.nodes) {
    const oldNode = before.nodes.get(parentId);
    const newIds = node.children.map(({ id: childId }) => childId);
    const oldIds = oldNode?.children.map(({ id: childId }) => childId);
    if (!oldNode || JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
      if (!newIds.length) continue;
      commands.push({ type: "REORDER_CHILDREN", parentId, childIds: newIds });
    }
  }

  return commands;
}

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
      const nextDocument = layersToPage(nextItems);
      engine.dispatchBatch(createNodeCommands(engine.getDocument(), nextDocument));
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
