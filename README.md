# UnMute

## Setup

Requires Node.js 22.18+ and pnpm 10.22+.

```sh
pnpm install
cp backend/.dev.vars.example backend/.dev.vars
# Fill in the backend variables described below.
pnpm --filter @unmute/backend db:migrate:local
pnpm generate
pnpm dev
```

- Frontend: `http://localhost:5173`
- API health: `http://localhost:8787/api/health`
- OpenAPI: `http://localhost:8787/api/openapi.json`

Local frontend requests use Vite's `/api` proxy to the backend.

## Google sign-in

Google OAuth is configured in project `unmute-angelo-2026` as **UnMute local development**. It uses the JavaScript origin `http://localhost:5173` and callback `http://localhost:5173/api/auth/callback/google`. The app is in external testing mode, with `angelonelson.dev@gmail.com` registered as a test user. Google sign-in creates an account on first use.

Set these server-only values in `backend/.dev.vars` (ignored by Git):

- `BETTER_AUTH_URL=http://localhost:5173`
- `BETTER_AUTH_SECRET`: generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: the Google OAuth web client credentials

Better Auth handles OAuth, session cookies, and sign-out. Drizzle stores accounts, sessions, verification records, and rate limits in the `unmute-auth` Cloudflare D1 binding. Auth mutations require the configured frontend origin. The frontend uses the Better Auth SDK through Vite's same-origin API proxy; product API contracts continue to use OpenAPI/Orval.

After changing the auth schema, regenerate it and its migration:

```sh
pnpm --filter @unmute/backend auth:generate
pnpm --filter @unmute/backend db:generate
pnpm --filter @unmute/backend db:migrate:local
```

The remote D1 database has its initial migration applied. Local development uses local D1 storage. Before a production deployment, configure its HTTPS frontend origin and auth URL, add its exact Google callback, and set Worker secrets using Wrangler. Local OAuth credentials are not shipped in the build.

Screenshots from the verified Google sign-in journey and both themes are in `artifacts/auth/`. API security checks can be repeated without opening a browser:

```sh
pnpm --filter @unmute/frontend exec playwright test --grep 'auth rejects|Google flow'
```

The full Playwright suite also includes theme, responsive-layout, and error-recovery checks. Use an authorized browser connection for UI verification under the repository's browser-profile rule.

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
