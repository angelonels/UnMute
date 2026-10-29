# UnMute refinement evidence

## Design

The selected direction uses an iris primary, a restrained rose secondary, and ivory/lavender studio surfaces. Shared semantic colors are expressed in OKLCH, with separately tuned dark values. Status colors retain their functional meanings.

The login uses an open composition, a large ceramic U and Mumo, a direct heading, one Google action, and a quiet development playground link. Extra slogans and internal illustration labels were removed. The shared original U mark appears throughout the application.

The workspace places the user account and name at the bottom of navigation. Its menu contains Settings and Sign out. Settings exposes account details and theme selection. The unused workspace information and side panel were removed. Sidebar collapse, mobile drawer, enlarged text, dialog stacking, and focus behavior were refined.

## Reliability and motion

Meeting-to-home navigation stays within the router and waits for session resolution without rendering a login flash. Mumo supports local pointer attention, greeting, keyboard activation, and reduced motion. The sculpture stays at a fixed camera angle and has no touch or pointer response. Mumo has a separate interaction target. The sculpture shares the same lazily imported WebGL scene as Mumo, with an image/SVG fallback when WebGL is unavailable or lost. Rounded ceramic geometry, a rose glazed terminal, shared lighting, Mumo’s shadow on the ceramic, geometry-derived seating and floor contact, and theme-specific exposure keep the composition coherent.

## Contrast

The eight `backdrop-contrast-*-contrast.json` files sample text against the rendered studio images at 320, 375, 1024, and 1440px in both themes. All meet the configured WCAG AA thresholds: 4.5:1 for normal text and 3:1 for the large heading. The smallest measured normal-copy ratio is 4.771:1. The light copyright correction exceeds 5:1 at desktop widths.

## Reproduction

Run from the repository root:

```sh
pnpm verify
pnpm --filter @unmute/frontend exec playwright test --workers=2 --reporter=list,html
pnpm run doctor
pnpm dev
```

Playwright uses an isolated test Chromium, explicitly authorized by the user. Authenticated workspace tests use local session fixtures; they do not perform a real Google sign-in.

## Measurement limits

No Chrome DevTools performance trace or Core Web Vitals score was collected. The project has a lazily loaded Three.js scene chunk of 575.47 kB minified / 146.69 kB gzip, which triggers Vite’s chunk-size advisory. The stage uses one renderer, 24fps / DPR≤1.25 / 512px shadows on compact canvases and 30fps / DPR≤1.5 / 1024px shadows on wide canvases. Quality tiers reconcile on resize. Visibility, reduced-motion, and cleanup guards remain in place. React Doctor scores 90/100 with two warnings: control-flow complexity in AICompanion and object-URL ownership in the existing chat helper. The URL helper retains explicit release callbacks used by its consumers; no suppression was added. The companion complexity warning remains visible. Final verification results are recorded below. Development also emits the existing next-themes script warning.

See `IMAGE-DIRECTION.md` for the built-in image generator direction and asset provenance. Final rendering evidence is saved beside this report.

## Arc usage

The Arc skill and review checklist were read for existing Arc touchpoints. The refinement preserves the installed chat components and their documented behavior. No additional Arc component installation or replacement was necessary for the final sculpture and brand work.

## Final validation

`pnpm verify` passed: formatting, lint, strict types, 3 backend and 32 frontend existing tests, generated-contract consistency, and both production builds. The final full Playwright run passed all 53 tests in 2.1 minutes with two workers. React Doctor scored 90/100 with the two findings described above. No requested verification check was skipped. The real OAuth sign-in and browser performance trace were not performed.

The first full browser run exposed a test synchronization issue: the reduced-motion baseline was captured before the explicit greeting ended. The test now waits for that interaction to settle, then still compares exact frames after 20 animation frames. The final full run passed without retries.

Screenshots cover desktop and phone, both themes, the workspace, enlarged mobile drawer text, Mumo’s greeting, and the WebGL fallback. `verification.json` records the tested commit and results.
