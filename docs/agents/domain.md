# Domain Docs

UnMute uses a single product-domain context.

## Before exploring

- Read `CONTEXT.md` at the repository root and use its canonical vocabulary.
- Read relevant decisions under `docs/adr/` when that directory exists.
- If either location is absent, proceed silently. Create domain documentation lazily through the domain-modeling workflow only when language or a durable architectural decision is actually resolved.

## Layout

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
├── frontend/
└── backend/
```

`CONTEXT.md` is a glossary, not an implementation specification. It defines product concepts shared across the modular monolith. ADRs record only decisions that are hard to reverse, surprising without context, and the result of a genuine trade-off.

## Use the glossary vocabulary

Use the terms defined in `CONTEXT.md` in issue titles, specifications, tests, and implementation discussions. If a needed concept is absent, reconsider whether it is implementation language or a genuine domain gap before adding it.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly rather than silently overriding the decision.
