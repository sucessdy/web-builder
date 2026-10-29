# Canvas website builder

This is a React website editor. You can make a page from blocks, edit it on the
canvas, generate a first draft from a brief, and download React or Next.js page
source.

## Start the app

Use Node.js 22.12 or newer and run `pnpm install`, then `pnpm dev` from the
repository root. The editor runs in Vite and connects to your Appwrite project.
Set its endpoint and project ID in `apps/editor/.env.local` before signing in.

## How the folders fit together

```text
apps/editor                 the screen users work in (canvas, layers, inspector)
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

The current screen stores its editable blocks in browser storage. The Canvas
converts those blocks into the shared page-document shape, validates it, and
renders it through `renderer-react`. The AI button currently uses local drafts
unless a server-side generation endpoint is configured. Code export packages
the current page as a React or Next.js component.

`apps/editor/AUTHENTICATION.md` explains Appwrite setup and workspace roles.

The preview apps and packages labeled “placeholder” are folders reserved for
future work; the first working editor flow currently targets React.
