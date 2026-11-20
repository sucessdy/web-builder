# Project guide

This guide describes the code that exists in this repository today. It separates
working app code from shared packages and planned architecture so the folder map
does not imply that placeholder apps already exist.

## Current app status

The repository has two runnable apps and three shared packages:

- **Editor (`apps/editor`)** — React, TypeScript, Vite, and Tailwind. It has a
  page canvas, insert library, nested layer tree, inspector, page actions,
  desktop/mobile preview, theme toggle, local/API persistence, AI dialogs,
  image upload, workspace access UI, and React/Next export.
- **API (`apps/api`)** — NestJS endpoints for pages, uploaded assets, and AI.
- **Document schema (`packages/document-schema`)** — Zod schemas and types for
  page documents, nodes, and style properties.
- **Component registry (`packages/component-registry`)** — JSON component
  defaults and editor metadata, validated against the document and prop schemas.
- **Editor engine (`packages/editor-engine`)** — immutable document commands,
  document validation, and undo/redo helpers.

The page and component editing flows are present in the editor. The shared
`editor-engine` now owns the active `PageDocument`, validates changes, and
provides undo/redo history. The UI keeps an `EditorLayer[]` adapter for its
existing panels. UI edits are diffed into node-level engine commands and
dispatched as one undoable batch; page loading and switching replace the active
document and reset history. The React renderer currently lives in the editor's
Canvas feature; there is no separate `renderer-react` package in this workspace.

The current inspector reads display and layout choices from validated JSON
metadata. Other style groups and component content fields still contain some
React-defined controls, so the inspector is only partly configuration-driven.
Length controls select their numeric value on focus and keep a local typing
draft, so users can clear and replace a value without the shorthand style
immediately filling it back in. Leaving a cleared length commits `0` in the
selected unit.

## Folder map

```text
apps/
  api/
    src/                    NestJS app, page/asset/AI controllers
  editor/
    src/
      App.tsx                Top-level editor composition
      features/
        auth/                Appwrite session, workspace, and invite flows
        canvas/              Canvas boundary and document rendering
        editor/              Sidebar, inspector, dialogs, controller, insert UI
          components/        Page list, layer tree, rail, workspace, inspector
          inspector/         Inspector property-control metadata and validation
          layouts/            JSON layout templates, registry, layout builder
      lib/                   Page model, API client, AI, export, file helpers
      theme/                 Theme state and light/dark color tokens
      page.json              Starter page document
packages/
  document-schema/           Page, node, and style schemas
  component-registry/         JSON component definitions and prop validation
  editor-engine/              Commands for adding/updating/deleting document nodes
```

At the repository root, `pnpm-workspace.yaml` defines the workspace,
`turbo.json` defines task ordering, and `pnpm-lock.yaml` pins dependency
versions. `dist/`, `.turbo/`, and `node_modules/` are generated or installed
output, not source folders.

Folders such as `apps/preview-react`, `apps/worker`, `packages/renderer-react`,
and `packages/design-tokens` are not present yet. They may be future directions,
but are not part of the current codebase.

## Editor data flow

1. `useEditorController` coordinates UI actions, page state, and persistence.
2. `use-editor-engine.ts` diffs UI changes into node-level commands for the
   shared `editor-engine`, which owns the active `PageDocument`, validation,
   and undo/redo history.
3. `page-model.ts` translates between the editor's nested `EditorLayer` model
   and validated `PageDocument` JSON.
4. Layout presets are loaded from JSON, checked against `NodeStyles`, and
   expanded into editable section trees by the shared layout builder.
5. Component insert cards use metadata from `component-registry` through the
   editor adapter in `layer-config.ts`.
6. The Canvas renders the resulting page document. Local storage and the API
   persist page documents; export uses the same page conversion boundary.

## Where changes usually belong

- Add a page node or style field: `packages/document-schema/src/`.
- Add component defaults or insert metadata:
  `packages/component-registry/src/components.json`.
- Add a layout preset: `apps/editor/src/features/editor/layouts/layout-presets.json`.
- Add inspector select options: `apps/editor/src/features/editor/inspector/style-controls.json`.
- Change page editing or save behavior: `apps/editor/src/features/editor/useEditorController.ts`.
- Change node rendering: `apps/editor/src/features/canvas/Canvas.tsx`.
- Change API routes: the relevant controller under `apps/api/src/`.
- Change application shell, theme tokens, or custom canvas visuals:
  `apps/editor/src/App.tsx`, `apps/editor/src/index.css`,
  `apps/editor/src/App.css`, and `apps/editor/src/theme/`.

## Commands

Run these from the repository root:

```sh
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
```

The editor can also be built or checked alone with
`pnpm --filter editor build` or `pnpm --filter editor typecheck`.
