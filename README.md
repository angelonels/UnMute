# UnMute

## Setup

Requires Node.js 22.18+ and pnpm 10.22+.

```sh
pnpm install
pnpm generate
pnpm dev
```

- Frontend: `http://localhost:5173`
- API health: `http://localhost:8787/api/health`
- OpenAPI: `http://localhost:8787/api/openapi.json`

Local frontend requests use Vite's `/api` proxy to the backend.

## Commands

| Command                                   | Purpose                                                               |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                | Start frontend and backend                                            |
| `pnpm dev:frontend`                       | Start the frontend                                                    |
| `pnpm dev:backend`                        | Start the backend                                                     |
| `pnpm verify`                             | Check formatting, lint, types, tests, generated artifacts, and builds |
| `pnpm build`                              | Build frontend and backend; backend build is a deployment dry run     |
| `pnpm test`                               | Run unit and component tests                                          |
| `pnpm generate`                           | Export OpenAPI and regenerate the API client                          |
| `pnpm run doctor`                         | Run React Doctor                                                      |
| `pnpm --filter @unmute/frontend test:e2e` | Run Playwright journeys                                               |
| `pnpm format`                             | Format the repository                                                 |
