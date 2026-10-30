# Mobile composition and iris light surfaces

Validated source commit: `e725ca9` on `polish/frontend-mumo-refinement` (2026-10-29).

The phone sign-in now has a deliberate vertical composition: a larger ceramic sculpture, centered typography, tighter spacing, and a full-width primary action. Compact phones use a smaller sculpture to keep the action visible. Short landscape screens use two columns. The desktop studio composition remains spacious. Mumo retains its independent touch target; the U remains a fixed sculpture.

Light surfaces share the primary hue, 282 degrees in OKLCH. Canvas `oklch(0.975 0.012 282)` and surface `oklch(0.988 0.006 282)` use high lightness and low chroma to create near-white iris neutrals. Their lightness difference establishes depth without heavy borders. Primary `oklch(0.55 0.18 282)` retains readable contrast over the tinted studio backdrop. The light desktop image uses multiply blending with the canvas so its whites belong to the same palette. Dark mode retains its existing tuned palette.

## Verification

- `pnpm verify`: passed formatting, lint, strict types, generated contracts, existing 3 backend and 32 frontend tests, and both production builds.
- Full isolated Chromium Playwright suite: 71 passed, 0 failed, 1.6 minutes.
- Ten mobile composition cases cover 320×568, 375×812, 430×932, 768×1024, and 812×375 in both themes. They check visible primary actions, sculpture sizing, touch target size, keyboard focus, and horizontal overflow. Light cases also inspect the rendered canvas tint.
- Eight actual-backdrop contrast cases cover light/dark at 320, 375, 1024, and 1440px. The sampler includes multiply blending. Minimum measured normal-copy contrast: 4.6557:1, above the unchanged 4.5:1 threshold. Semantic palette pairs also pass.
- React Doctor: 90/100. Remaining warnings are AI companion control-flow complexity and the existing object URL ownership helper. Release callbacks were reviewed; no checks were suppressed.
- Built-in browser review retained the real signed-in session and showed the wide light workspace. Automated screenshots cover the sign-in screen without signing the user out.

## Evidence and limits

`mobile-{light,dark}-{320,375,430,768,812}.png` captures all ten compositions. The 812px image is landscape. Desktop login and phone/wide workspace screenshots are included. JSON files contain repeatable contrast measurements and verification metadata.

Repeat with `pnpm verify`, `pnpm exec playwright test` from `frontend/`, and `pnpm run doctor` from the repository root. Playwright writes screenshots and attachments under `frontend/test-results/`.

No Chrome DevTools/Core Web Vitals trace was collected. Real Google OAuth was not performed by E2E; auth fixtures and boundary checks were used. The existing lazy Three.js chunk advisory and next-themes development script warning remain. These refinements introduce no dependency.

The application is left running at http://localhost:5173/.
