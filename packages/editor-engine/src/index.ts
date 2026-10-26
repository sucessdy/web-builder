
import {
  pageDocumentSchema,
  type PageDocument,
  type PageNode,
} from "@visual-builder/document-schema";

import {
  createDefaultNode,
  type ComponentType,
} from "@visual-builder/component-registry";

export type EditorCommand =
  | { type: "ADD_NODE"; parentId: string; node: PageNode }
  | { type: "UPDATE_PROPS"; nodeId: string; props: Record<string, unknown> }
  | { type: "UPDATE_STYLES"; nodeId: string; styles: PageNode["styles"] }
  | { type: "DELETE_NODE"; nodeId: string };

export function findNode(
  root: PageNode,
  nodeId: string,
): PageNode | undefined {
  if (root.id === nodeId) return root;

  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }

  return undefined;
}

function updateNode(
  node: PageNode,
  nodeId: string,
  updater: (node: PageNode) => PageNode,
): PageNode {
  if (node.id === nodeId) return updater(node);

  return {
    ...node,
    children: node.children.map((child) =>
      updateNode(child, nodeId, updater),
    ),
  };
}

export function applyCommand(
  document: PageDocument,
  command: EditorCommand,
): PageDocument {
  let next: PageDocument;

  switch (command.type) {
    case "ADD_NODE": {
      if (findNode(document.root, command.node.id)) {
        throw new Error(`Duplicate node ID: ${command.node.id}`);
      }

      const parent = findNode(document.root, command.parentId);
      if (!parent) {
        throw new Error(`Parent node not found: ${command.parentId}`);
      }

      next = {
        ...document,
        root: updateNode(document.root, parent.id, (node) => ({
          ...node,
          children: [...node.children, command.node],
        })),
      };
      break;
    }

    case "UPDATE_PROPS": {
      if (!findNode(document.root, command.nodeId)) {
        throw new Error(`Node not found: ${command.nodeId}`);
      }

      next = {
        ...document,
        root: updateNode(document.root, command.nodeId, (node) => ({
          ...node,
          props: { ...node.props, ...command.props },
        })),
      };
      break;
    }

    case "UPDATE_STYLES": {
      if (!findNode(document.root, command.nodeId)) {
        throw new Error(`Node not found: ${command.nodeId}`);
      }

      next = {
        ...document,
        root: updateNode(document.root, command.nodeId, (node) => ({
          ...node,
          styles: { ...node.styles, ...command.styles },
        })),
      };
      break;
    }

    case "DELETE_NODE": {
      if (document.root.id === command.nodeId) {
        throw new Error("The root node cannot be deleted.");
      }

      if (!findNode(document.root, command.nodeId)) {
        throw new Error(`Node not found: ${command.nodeId}`);
      }

      next = {
        ...document,
        root: {
          ...document.root,
          children: removeNode(document.root.children, command.nodeId),
        },
      };

      // Handle deletion at any nesting depth.
      next = {
        ...document,
        root: deleteNestedNode(document.root, command.nodeId),
      };
      break;
    }
  }

  const result = pageDocumentSchema.safeParse(next);
  if (!result.success) {
    throw new Error(`Invalid page document: ${result.error.message}`);
  }

  return result.data;
}

function removeNode(
  nodes: PageNode[],
  nodeId: string,
): PageNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: removeNode(node.children, nodeId),
    }));
}

function deleteNestedNode(
  node: PageNode,
  nodeId: string,
): PageNode {
  return {
    ...node,
    children: removeNode(node.children, nodeId),
  };
}

export function createNode(
  type: ComponentType,
  id: string,
): PageNode {
  return createDefaultNode(type, id);
}

export function createEditorEngine(initialDocument: PageDocument) {
  const parsed = pageDocumentSchema.parse(initialDocument);
  let currentDocument = parsed;
  const undoStack: PageDocument[] = [];
  const redoStack: PageDocument[] = [];

  return {
    getDocument(): PageDocument {
      return currentDocument;
    },

    dispatch(command: EditorCommand): PageDocument {
      const nextDocument = applyCommand(currentDocument, command);

      undoStack.push(currentDocument);
      currentDocument = nextDocument;
      redoStack.length = 0;

      return currentDocument;
    },

    undo(): PageDocument {
      const previous = undoStack.pop();
      if (!previous) return currentDocument;

      redoStack.push(currentDocument);
      currentDocument = previous;
      return currentDocument;
    },

    redo(): PageDocument {
      const next = redoStack.pop();
      if (!next) return currentDocument;

      undoStack.push(currentDocument);
      currentDocument = next;
      return currentDocument;
    },
  };
}
 