# UnMute
A video platform smart enough to take the heat, take the notes, and let you take the credit.

## Workspace

pnpm modular monolith:

- `frontend` — React, Vite, Astryx, TanStack Router/Query
- `backend` — Cloudflare Workers, Hono, Zod OpenAPI
- `packages/shared` — framework-neutral domain code

## Setup

Requires Node 22+ and pnpm 10.22+.

```sh
pnpm install
pnpm generate
pnpm dev
```

- App: http://localhost:5173
- API health: http://localhost:8787/api/health
- OpenAPI: http://localhost:8787/api/openapi.json

Local frontend calls go through Vite's `/api` proxy. Leave `VITE_API_BASE_URL` empty in development.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Frontend and API together |
| `pnpm generate` | Export OpenAPI, then regenerate the Orval client |
| `pnpm typecheck` | Typecheck every package |
| `pnpm test` | Package unit/component tests |
| `pnpm build` | Production builds |
| `pnpm doctor` | React Doctor on the frontend |
