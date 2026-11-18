# Canvas website builder

A pnpm monorepo for a visual website editor and its API. The working apps are
the React/Vite editor and the NestJS API. Shared page validation, component
definitions, and document editing operations live in `packages/`.

## Run locally

Use Node.js 22.12 or newer.

```sh
pnpm install
pnpm dev
```

The editor defaults to `http://localhost:5173`; the API defaults to port 3000.
Copy `apps/editor/.env.example` to `apps/editor/.env.local` for Appwrite and
`apps/api/.env.example` to `apps/api/.env` for the AI provider.

## Repository guide

See [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for the folder map, editor data flow,
implemented features, and current architecture boundaries.
