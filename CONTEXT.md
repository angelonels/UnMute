# CONTEXT.md

UnMute is a video platform that takes the heat, takes the notes, and lets you take the credit.

This file is product context, not implementation authority. Folder shape, stack, and delivery rules live in AGENTS.md.

## Locked UI

Foundations (the earlier `/_prototype/foundations` comparison board is superseded):

- Volt accent over cool midnight ink, comfortable density, nested soft geometry, layered elevation, IBM Plex
- Dark-first for live media. The light studio sheet is fully supported.
- The live foundation reference is `/_prototype/design-system`; stable usage rules live in `frontend/src/theme/FOUNDATIONS.md`.

In-call stage (from `/_prototype/call-shell`):

- One hybrid grid: equal gallery until someone is pinned, spotlight while they are
- Gallery: same-size 16:9 tiles, last row centered, reflow on count and stage size
- Spotlight: pinned person fills the main area; others sit in a strip (side if few and wide, otherwise bottom)
- Pin is optional. Nobody in spotlight is a valid state, never default to a speaker
- Chrome on video stays dim and readable (dock, cue, names). Do not promote the prototype into `frontend/shared` until a real call feature needs it
