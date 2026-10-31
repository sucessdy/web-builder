# Current project layout

This map reflects the folders and files currently present in the checkout.

```text
apps/editor/
├── public/
├── src/
│   ├── assets/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx
│   │   │   └── canvas-document.ts
│   │   ├── editor/
│   │   │   ├── EditorChrome.tsx
│   │   │   ├── EditorDialogs.tsx
│   │   │   ├── EditorPanels.tsx
│   │   │   ├── layer-config.ts
│   │   │   ├── useEditorController.ts
│   │   │   └── useWorkspaceAccess.ts
│   │   └── icons/
│   │       └── Icon.tsx
│   ├── lib/
│   │   ├── ai-generator.ts
│   │   ├── code-export.ts
│   │   ├── download.ts
│   │   ├── page-model.ts
│   │   └── read-image-file.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   └── page.json
└── package.json

packages/
├── component-registry/
├── design-tokens/
├── document-schema/
└── editor-engine/
```

`page.json` is the starter page document. `src/lib/page-model.ts` converts it to
the editor's layer controls. Editor state and commands live in the editor feature;
the screen is assembled from panels, dialogs, and canvas components. Layer
defaults and icons share a typed configuration in `features/editor/layer-config.ts`.
