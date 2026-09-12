# AGENTS.md

## Rules

* Precedence: task instructions > deepest applicable `AGENTS.md` > parent `AGENTS.md`. Read root `CONTEXT.md` if present for product context, not implementation authority.
* This repo is a **modular monolith**. Preserve the `backend/`, `frontend/`, and `packages/shared/` boundaries and existing conventions.
* Repository truth: code, tests, usages, lockfiles, package/config files, migrations, scripts, then docs. Inspect nearby code before editing; use official docs for installed versions when needed.
* Make the smallest complete change. Preserve unrelated behavior; avoid speculative abstractions, refactors, dependencies, services, or empty architecture layers.
* Keep TypeScript strict. Do not use `any`, `@ts-ignore`, disabled rules, skipped tests, weaker config, or weaker security to make checks pass.
* Comments explain reasons, constraints, or public contracts, never narrate code. Never hand-edit generated files; change their source/config and regenerate.
* Keep this root file short. Put stable area-specific rules in nested `AGENTS.md` files only when needed.

## Stack

* **Frontend:** React, TypeScript, Vite, Astryx, Tailwind CSS, Motion, Lucide Animated, ShaderGradient, TanStack Router/Query, Zustand, Zod, Sonner.
* **Backend:** Cloudflare Workers + repo-configured Cloudflare services, Hono, TypeScript, Zod, Better Auth, Drizzle ORM.
* **Contract:** Hono + Zod -> OpenAPI -> Orval -> generated frontend client.
* **Quality:** React Doctor, Vitest, React Testing Library, Playwright. Storybook is optional. TanStack Charts only when needed.
* Prefer Web-standard and Cloudflare-native capabilities. Add another dependency or service only for a real unmet requirement.

## Shape

Use vertical feature slices inside technical top-level boundaries; create only directories the feature needs.

```text
.
├── backend/
│   └── src/
│       ├── core/                    # env, DB/runtime, middleware, logging, errors
│       ├── features/<feature>/
│       │   ├── api/                 # Hono routes + Zod/OpenAPI transport schemas
│       │   ├── policies/            # authorization/domain rules
│       │   ├── use-cases/           # business logic/orchestration
│       │   ├── repositories/        # Drizzle/storage access
│       │   ├── db/schema.ts         # feature persistence schema, when needed
│       │   └── index.ts             # public feature API
│       └── index.ts                 # root Hono composition
├── frontend/
│   └── src/
│       ├── features/<feature>/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── store/               # feature client state, only when needed
│       │   └── index.ts             # public feature API
│       ├── shared/                  # stable cross-feature UI/hooks/lib
│       ├── routes/                  # TanStack Router
│       ├── api/                     # Orval generated; never hand-edit
│       └── main.tsx
└── packages/shared/src/
    ├── schemas/                     # framework-neutral domain schemas
    ├── rules/                       # pure shared rules
    ├── types/
    └── constants/
```

`frontend -> packages/shared <- backend`; shared imports neither app and contains no React, Hono, Cloudflare-runtime, Drizzle-adapter, or browser implementation. Shared schemas model reusable domain concepts, not HTTP DTOs; OpenAPI/Orval owns transport types. Infer TypeScript types from Zod schemas instead of duplicating shapes.

Keep code with its owning feature until at least two features need the same stable abstraction. Cross-feature imports use the owner's public API (`index.ts` where established); avoid deep imports, cycles, generic dumping grounds, and premature `shared/` promotion.

## Ownership

* **HTTP:** Hono routes parse/validate/map HTTP and call use cases; no business logic in handlers.
* **Business:** feature `use-cases/`; the operation owner handles cross-feature orchestration.
* **Auth:** Better Auth owns standard auth/session behavior; backend `policies/` enforce authorization. Frontend checks are UX only.
* **Persistence:** feature repositories + Drizzle + configured Cloudflare storage; use migrations and do not rewrite applied migrations unless repo workflow permits it.
* **Validation/API:** Zod at untrusted boundaries. Hono + Zod is the API source; regenerate OpenAPI + Orval after contract changes. Use generated clients directly unless a wrapper adds real behavior.
* **State:** TanStack Router owns URL/navigation state; TanStack Query owns remote/server state; React owns local state first; Zustand only for genuinely shared client state. Never copy Query data into Zustand.
* **UI:** Astryx first for standard UI; Tailwind for composition/custom visuals; Motion for purposeful transitions; Lucide Animated for meaningful icon feedback; ShaderGradient only as progressive enhancement; Sonner for transient notifications.
* **Accessibility/performance:** preserve semantic HTML, keyboard/focus behavior, accessible names, reduced motion, responsive states, and performance on live/media-heavy surfaces.

## Delivery

Build the complete slice the task needs, skipping irrelevant steps: `Domain/DB -> Use case/API -> OpenAPI/Orval -> Frontend -> Verify`.

For contract changes, define explicit request/response schemas, regenerate OpenAPI/Orval before frontend integration, then update affected callers/tests. Do not force full-stack work for frontend-only, backend-only, refactor, or infrastructure tasks. Generated output changes only through generation commands.

## Reliability, security, tests

* Use structured backend logging with stable events and request/correlation IDs. Never log or expose secrets, tokens, cookies, auth headers, passwords, sensitive bodies, stack traces, DB errors, or internal exceptions.
* Use explicit application/domain errors and one central HTTP error mapping. Client behavior relies on stable error codes/typed results, not raw server text or HTTP status as a domain identifier. Never swallow errors.
* Enforce authorization server-side; validate untrusted input; keep Cloudflare bindings/secrets server-only. Do not deploy, mutate production resources, or run destructive storage operations unless explicitly required.
* Test behavior/contracts, not implementation details. Use Vitest/RTL for unit/component behavior; Playwright for important browser/E2E journeys. Prefer network-boundary tests over mocking TanStack Query or generated clients. Run React Doctor for meaningful React changes when available; do not suppress findings just for a clean score.
* Storybook is optional: use it only when already adopted or when isolated visual-state development materially helps.

## Done

Use repo-defined package-manager commands/scripts. For public API, schema, contract, auth, or persistence changes, update affected callers, tests, docs, migrations, and generated output in the same change. Run applicable format, lint, typecheck, tests, React Doctor, build, OpenAPI/Orval generation, and migration checks. Report checks not run and why; never claim an unrun check passed.
