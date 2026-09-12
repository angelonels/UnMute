# CONTEXT.md

UnMute is a video platform that takes the heat, takes the notes, and lets you take the credit.

This file is product context, not implementation authority. Folder shape, stack, and delivery rules live in AGENTS.md.

## Locked UI

Foundations (from `/_prototype/foundations`):

- Hue amber, tone dim, density comfortable, roundness softer, elevation shadow, type IBM Plex
- Dark-first. Light sheet is kept, not the default.

In-call stage (from `/_prototype/call-shell`):

- One hybrid grid: equal gallery until someone is pinned, spotlight while they are
- Gallery: same-size 16:9 tiles, last row centered, reflow on count and stage size
- Spotlight: pinned person fills the main area; others sit in a strip (side if few and wide, otherwise bottom)
- Pin is optional. Nobody in spotlight is a valid state, never default to a speaker
- Chrome on video stays dim and readable (dock, cue, names). Do not promote the prototype into `frontend/shared` until a real call feature needs it
