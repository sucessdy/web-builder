
import {
  pageDocumentSchema,
  type PageDocument,
  type PageNode,
} from "@visual-builder/document-schema";

import {
  createDefaultNode,
  type ComponentType,
  validateComponentProps,
} from "@visual-builder/component-registry";

export type EditorCommand =
  | { type: "ADD_NODE"; parentId: string; node: PageNode }
  | { type: "MOVE_NODE"; nodeId: string; parentId: string }
  | { type: "REORDER_CHILDREN"; parentId: string; childIds: string[] }
  | { type: "UPDATE_PROPS"; nodeId: string; props: Record<string, unknown> }
  | { type: "UPDATE_STYLES"; nodeId: string; styles: PageNode["styles"] }
  | { type: "REPLACE_PROPS"; nodeId: string; props: Record<string, unknown> }
  | { type: "REPLACE_STYLES"; nodeId: string; styles: PageNode["styles"] }
  | { type: "UPDATE_NODE_META"; nodeId: string; name?: string; visible?: boolean }
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

    case "MOVE_NODE": {
      if (document.root.id === command.nodeId) {
        throw new Error("The root node cannot be moved.");
      }
      const movingNode = findNode(document.root, command.nodeId);
      if (!movingNode) throw new Error(`Node not found: ${command.nodeId}`);
      if (!findNode(document.root, command.parentId)) {
        throw new Error(`Parent node not found: ${command.parentId}`);
      }
      if (findNode(movingNode, command.parentId)) {
        throw new Error("A node cannot be moved inside itself or its descendants.");
      }
      const withoutNode = deleteNestedNode(document.root, command.nodeId);
      next = {
        ...document,
        root: updateNode(withoutNode, command.parentId, (parent) => ({
          ...parent,
          children: [...parent.children, movingNode],
        })),
      };
      break;
    }

    case "REORDER_CHILDREN": {
      const parent = findNode(document.root, command.parentId);
      if (!parent) throw new Error(`Parent node not found: ${command.parentId}`);
      const currentIds = parent.children.map(({ id }) => id);
      const uniqueIds = new Set(command.childIds);
      if (
        uniqueIds.size !== command.childIds.length ||
        currentIds.length !== command.childIds.length ||
        currentIds.some((id) => !uniqueIds.has(id))
      ) {
        throw new Error("Reordered children must contain every current child exactly once.");
      }
      const childById = new Map(parent.children.map((child) => [child.id, child]));
      next = {
        ...document,
        root: updateNode(document.root, parent.id, (node) => ({
          ...node,
          children: command.childIds.map((id) => childById.get(id)!),
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

    case "REPLACE_PROPS": {
      if (!findNode(document.root, command.nodeId)) {
        throw new Error(`Node not found: ${command.nodeId}`);
      }
      next = {
        ...document,
        root: updateNode(document.root, command.nodeId, (node) => ({
          ...node,
          props: command.props,
        })),
      };
      break;
    }

    case "REPLACE_STYLES": {
      if (!findNode(document.root, command.nodeId)) {
        throw new Error(`Node not found: ${command.nodeId}`);
      }
      next = {
        ...document,
        root: updateNode(document.root, command.nodeId, (node) => ({
          ...node,
          styles: command.styles,
        })),
      };
      break;
    }

    case "UPDATE_NODE_META": {
      if (!findNode(document.root, command.nodeId)) {
        throw new Error(`Node not found: ${command.nodeId}`);
      }
      next = {
        ...document,
        root: updateNode(document.root, command.nodeId, (node) => {
          return {
            ...node,
            ...(command.name !== undefined ? { name: command.name } : {}),
            ...(command.visible !== undefined ? { visible: command.visible } : {}),
          };
        }),
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
        root: deleteNestedNode(document.root, command.nodeId),
      };
      break;
    }
  }

  const result = pageDocumentSchema.safeParse(next);
  if (!result.success) {
    throw new Error(`Invalid page document: ${result.error.message}`);
  }
  validateComponentTree(result.data.root);

  return result.data;
}

function validateComponentTree(node: PageNode): void {
  const result = validateComponentProps(node.type, node.props);
  if (!result.success) {
    throw new Error(`Invalid properties for ${node.type} node ${node.id}: ${result.error.message}`);
  }
  node.children.forEach(validateComponentTree);
}

function deleteNestedNode(
  node: PageNode,
  nodeId: string,
): PageNode {
  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => deleteNestedNode(child, nodeId)),
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
  validateComponentTree(parsed.root);
  let currentDocument = parsed;
  const undoStack: PageDocument[] = [];
  const redoStack: PageDocument[] = [];

  function dispatchBatch(commands: EditorCommand[]): PageDocument {
    if (commands.length === 0) return currentDocument;

    let nextDocument = currentDocument;
    for (const command of commands) {
      nextDocument = applyCommand(nextDocument, command);
    }

    undoStack.push(currentDocument);
    if (undoStack.length > 30) undoStack.shift();
    currentDocument = nextDocument;
    redoStack.length = 0;
    return currentDocument;
  }

  return {
    getDocument(): PageDocument {
      return currentDocument;
    },

    dispatch(command: EditorCommand): PageDocument {
      return dispatchBatch([command]);
    },

    dispatchBatch(commands: EditorCommand[]): PageDocument {
      return dispatchBatch(commands);
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

    replaceDocument(document: PageDocument): PageDocument {
      const parsed = pageDocumentSchema.parse(document);
      validateComponentTree(parsed.root);
      currentDocument = parsed;
      undoStack.length = 0;
      redoStack.length = 0;
      return currentDocument;
    },

    getUndoCount(): number {
      return undoStack.length;
    },

    getRedoCount(): number {
      return redoStack.length;
    },
  };
}

