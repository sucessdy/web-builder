# Canvas website builder

This is a React website editor. You can make a page from blocks, edit it on the
canvas, generate a first draft from a brief, and download React or Next.js page
source.

## Start the app

Use Node.js 22.12 or newer and run `pnpm install`, then `pnpm dev` from the
repository root. The editor runs in Vite and the NestJS API runs on port 3000.
Copy `apps/editor/.env.example` to `apps/editor/.env.local` for Appwrite setup,
and copy `apps/api/.env.example` to `apps/api/.env` to configure the AI provider.
The API stores page documents in `apps/api/data` and Multer uploads in
`apps/api/uploads`. AI provider keys stay on the server.

## How the folders fit together

```text
apps/editor                 the screen users work in (canvas, layers, inspector)
apps/api                    NestJS pages, image upload, and AI endpoints
Appwrite                    accounts, sessions, workspace teams, invitations
apps/preview-react          placeholder for viewing a published React site
apps/preview-vue             placeholder for viewing a published Vue site
apps/preview-angular         placeholder for viewing a published Angular site
apps/worker                  placeholder for background jobs
packages/document-schema    rules for what valid page JSON looks like
packages/component-registry supported blocks and their default/editable props
packages/renderer-react     turns validated page JSON into React elements
packages/editor-engine      safe commands for changing a page document
packages/design-tokens      placeholder for shared colors, spacing, and fonts
packages/export-engine      placeholder for production export pipelines
packages/renderer-contract  placeholder for shared renderer interfaces
packages/renderer-vue       placeholder for rendering page JSON with Vue
packages/renderer-angular   placeholder for rendering page JSON with Angular
packages/shared             placeholder for shared utilities
```

The editor stores pages in browser storage and syncs page documents to the API. The Canvas
converts those blocks into the shared page-document shape, validates it, and
renders them. The AI assistant and page generator call the NestJS API, while
image files upload with Multer and are served from `/uploads`. Code export
packages the current page as a React or Next.js component.

`apps/editor/AUTHENTICATION.md` explains Appwrite setup and workspace roles.

The preview apps and packages labeled “placeholder” are folders reserved for
future work; the first working editor flow currently targets React.
