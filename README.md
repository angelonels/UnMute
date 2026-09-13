# UnMute

A video platform smart enough to take the heat, take the notes, and let you take the credit.

## Workspace

- `frontend` — React, Vite, Astryx, TanStack Router/Query
- `backend` — Cloudflare Workers, Hono, Zod OpenAPI

Requires Node 22+ and pnpm 10.22+.

```sh
pnpm install
pnpm generate
pnpm dev
```

App: `http://localhost:5173` · health: `http://localhost:8787/api/health` · OpenAPI: `http://localhost:8787/api/openapi.json`. Local frontend requests use Vite's `/api` proxy.

| Command                                   | Purpose                                                          |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `pnpm verify`                             | Format, lint, types, tests, generated drift, theme drift, builds |
| `pnpm generate`                           | Export OpenAPI and regenerate Orval                              |
| `pnpm theme:build`                        | Regenerate Astryx theme artifacts                                |
| `pnpm doctor`                             | React Doctor                                                     |
| `pnpm --filter @unmute/frontend test:e2e` | Playwright journeys                                              |
