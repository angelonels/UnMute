# UnMute design foundation

This theme is the product-level layer over Astryx. Astryx owns primitives, semantics, keyboard behavior, and most component states. UnMute owns the visual character and the product rules below.

## Character

- Dark-first, because the primary working surface is live video.
- Volt is the single product accent: electric chartreuse over midnight ink. It marks primary actions, selection, focus, and the moments where UnMute helps someone move the conversation forward.
- Neutral surfaces carry a cool midnight cast and separate through a deliberate body → surface → card → popover hierarchy. The light theme uses a clean studio sheet with the same structure.
- IBM Plex Sans carries product UI. IBM Plex Mono is reserved for AI cues, timestamps, transcripts, and technical metadata.
- Geometry is soft enough for long sessions without turning every control into a pill.
- Shadows are multi-layered and communicate real stacking. Page grouping uses spacing, `Section`, and dividers before `Card`.

## Interaction contract

- Use one primary action per region.
- Pressable controls receive a subtle `scale(0.975)` response through the theme.
- Frequent hover and selection feedback uses the fast motion token. Panels and dialogs may use the medium token.
- Do not animate keyboard-initiated actions or block interaction until an animation completes.
- Coarse pointers receive larger control heights automatically through theme adaptations.
- Reduced-motion users receive instant spatial transitions; color and opacity can still communicate state where the component supports them.

## Color contract

- Use semantic Astryx tokens and component variants. Never reference the Volt value directly in product code.
- Use success, warning, and error colors only for their meaning. They do not become secondary brand colors.
- Pair accent and status fills with their matching on-color token. The theme pairs were checked against WCAG AA contrast targets; do not swap foregrounds by eye.
- Live-video chrome uses `MediaTheme mode="dark"` so it remains legible regardless of the surrounding sheet.
- Light mode is a supported sheet, not the default in-call presentation.

## Layout contract

- Start product pages with `AppShell`, then budget regions with `Layout`.
- Use `VStack`/`HStack` for one-dimensional composition and `Grid` for responsive multi-column composition.
- Default to `Section` for page regions. Use `Card` only for a discrete widget, object, or elevated overlay.
- Interior spacing comes from Astryx spacing props. Raw pixels are reserved for structural region widths and media-grid math.
- Let dense collections render as `List` or `Table` rows with dividers, not one card per record.

## Spacing and elevation

- The base spacing unit is 4px. Use gaps 1–2 to bind an item, 3–4 inside a component, and 6–8 between page regions.
- Keep one content line per region. The container owns its padding; children should not add a second inset.
- `low` elevation lifts a pressable or compact floating control, `med` is for menus and popovers, and `high` is reserved for dialogs or critical floating chrome.
- Radius follows nesting: inner 6px, controls 10px, containers 18px, pages 24px. Do not turn ordinary controls into pills.

## Iconography

- The Astryx semantic icon registry is mapped to normal Lucide icons in `unmute-icons.tsx`; this automatically covers fields, selectors, menus, status, and framework controls.
- Import a Lucide icon directly only for a product concept that has no Astryx semantic name. Pass it through Astryx `Icon` or an Astryx component's icon prop so size and color remain token-driven.
- Default icon strokes use 1.8px with absolute stroke width. Do not mix filled icon families into the same control row unless the fill communicates state.

## Component workflow

Before building a screen:

1. Run `pnpm exec astryx build "<screen description>"`.
2. Read `pnpm exec astryx docs layout` and write down the region budgets and breakpoint behavior.
3. Inspect every chosen component with `pnpm exec astryx component <Name>`.
4. Use component props first, then token-backed Tailwind utilities. Swizzle only when a real product requirement cannot be met otherwise.
5. Validate the result in `/_prototype/design-system` in both color modes and at narrow and wide widths.

The generated `unmute.css`, `unmute.js`, declarations, and variants are build artifacts. Change `unmute-theme.ts`, then run `pnpm run theme:build`.
