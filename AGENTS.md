# AGENTS.md

## Agent skills

### Issue tracker

Issues, specifications, and Wayfinder maps are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the standard `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix` labels. See `docs/agents/triage-labels.md`.

### Domain docs

UnMute uses a single product-domain context rooted at `CONTEXT.md`. See `docs/agents/domain.md`.

## Rules

- Precedence: task > deepest `AGENTS.md` > parent. `CONTEXT.md` is product context, never implementation authority.
- This is a modular monolith. Keep `frontend/` and `backend/` independently buildable; add a shared package only when both runtimes use the same framework-neutral domain concept.
- Repository truth: code, tests, usages, lockfiles/config, generated contracts, then docs. Inspect nearby code before editing.
- Make the smallest complete change. No speculative layers, dependencies, services, empty directories, deep imports across features, or disabled checks.
- Keep TypeScript strict: no `any`, `@ts-ignore`, swallowed errors, skipped tests, or weakened security.
- Comments explain reasons or contracts. Change generated artifacts only through their generator.

## Shape and dependencies

Create only the directories a feature needs.

```text
backend/src/core/                 runtime, middleware, logging, errors
backend/src/features/<feature>/   api, use-cases, policies, repositories, db, index.ts
frontend/src/app/                 app-wide providers and router adapters
frontend/src/api/                 transport adapter plus generated client
frontend/src/features/<feature>/  components, hooks, local state, index.ts
frontend/src/routes/              thin route composition
frontend/src/theme/               Astryx theme source and generated artifacts
```

Dependency flow: routes → feature public APIs → generated API client. Business operations flow from HTTP handlers → use cases → policies/repositories. Transport-only endpoints may respond directly. Features never depend on routes; handlers never access persistence or server-vendor integrations directly. Promote code only after two owners need the same stable abstraction.

## Ownership

- Hono handlers own validation, authentication context, and HTTP mapping. They delegate business operations to use cases but may answer transport-only requests directly. Use cases own business orchestration; policies own authorization; repositories own storage.
- Hono + Zod OpenAPI is the transport source. Regenerate OpenAPI and Orval after contract changes; do not duplicate inferred types or wrap generated clients without behavior.
- TanStack Router owns URL state, Query owns server state, React owns local state. Add Zustand only for genuine shared client state; never mirror Query data.
- Astryx owns standard UI semantics and states. Tailwind composes token-backed custom visuals. Add Motion, animated icons, Sonner, charts, or shader effects only when a shipped interaction needs them; normal Lucide is the default icon set.
- Better Auth and Drizzle are preferred when auth/persistence are introduced, but are not installed requirements.
- Keep third-party SDKs at explicit integration boundaries. Features depend on application-facing interfaces, not vendor IDs, configuration, payloads, or types. Server SDKs remain backend-only; browser media SDKs stay behind a frontend media adapter. Create the boundary only when its first vendor arrives.
- Use semantic HTML and native behavior; preserve keyboard access, focus, reduced motion, responsive states, and performance on media-heavy surfaces.

## Reliability and delivery

- Validate untrusted input and enforce authorization server-side. Keep bindings/secrets server-only.
- Log structured stable events with request IDs; never log credentials, cookies, auth headers, sensitive bodies, internal errors, or stack traces.
- Map explicit application errors centrally to stable codes; clients do not infer domain meaning from raw status/text.
- Test behavior and contracts: Vitest/RTL for units and components, Playwright for important journeys. Prefer network-boundary tests over mocking generated clients.
- For contract changes: domain/storage → use case/API → OpenAPI/Orval → frontend → verification. Skip layers the task does not touch.
- Run `pnpm verify`; run Playwright and React Doctor when relevant. Report every skipped check and never claim an unrun check passed.
