# UnMute visual contract

Astryx owns accessible primitives and interaction states; `unmute-theme.ts` owns product character. Change the source theme, then run `pnpm theme:build`—never edit generated theme files.

## Character

- Dark-first live-media canvas; light mode is a fully supported studio sheet.
- Volt is the only brand accent: primary action, selection, focus, and AI assistance. Status colors keep semantic meaning.
- Cool midnight surfaces progress body → surface → card → popover. Prefer spacing, sections, and dividers before elevation.
- IBM Plex Sans is UI copy; Plex Mono is timestamps, transcripts, AI cues, and technical metadata.
- Geometry is nested, not pill-heavy: inner 6px, controls 10px, containers 18px, pages 24px.

## Composition

- Frame pages with `AppShell`; use `Layout`, `VStack`/`HStack`, and `Grid` to budget regions.
- `Section` groups a page; `Card` represents a discrete object/widget. Dense collections use `List`/`Table` rows.
- One container owns each inset. Use 4px-based token gaps: 1–2 binds, 3–4 composes a control, 6–8 separates regions. Raw pixels are only for structural widths or media-grid math.
- Elevation `low` lifts compact controls, `med` menus/popovers, and `high` dialogs or critical chrome.

## Interaction

- One primary action per region. Use semantic tokens and matching on-colors; never hardcode the Volt value.
- Normal Lucide icons are the default. Use animated icons only when animation communicates a state transition; keep sizing/color token-driven.
- Press feedback is subtle. Fast motion serves frequent feedback; medium motion serves panels/dialogs. Never delay an action for animation.
- `MediaTheme mode="dark"` protects video chrome contrast. Validate wide/narrow, dark/light, keyboard, coarse pointer, and reduced motion in real feature screens.

Before new UI, run `pnpm exec astryx build "<screen>"`, read `pnpm exec astryx docs layout`, then inspect each chosen primitive with `pnpm exec astryx component <Name>`.
