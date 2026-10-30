# Softer light mode

Source commit: `aeed632` on `polish/frontend-mumo-refinement`, 2026-10-29.

The previous palette left large panels at OKLCH lightness 0.988, close to white. This refinement lowers canvas lightness from 0.975 to 0.94 and panel lightness from 0.988 to 0.958. Chroma stays restrained (0.014 and 0.01) at the iris primary hue of 282 degrees. The result is a muted, lightly tinted canvas and panel system across sign-in, workspace, meetings, menus, and settings.

Primary changes from `oklch(0.55 0.18 282)` to `oklch(0.52 0.17 282)` to retain readable links over the darker studio backdrop. Borders and rose supporting surfaces follow the lower lightness range. The small sign-in footer uses a deeper iris neutral after the actual-backdrop measurement found its former color insufficient on desktop. Dark tokens are unchanged.

The regression test now rejects glaring mobile canvas RGB values as well as neutral white, while retaining a lower brightness bound and the iris tint check. The test failed against the previous palette before the source change. Existing contrast thresholds remain unchanged.

`pnpm verify` passed formatting, lint, strict types, existing tests, contract consistency, and both production builds. React Doctor remains 90/100 with the existing AI control-flow and object URL ownership warnings. No checks were suppressed. No new performance trace was collected; the existing lazy Three.js chunk advisory remains.

The built-in browser was used to inspect the actual signed-in light workspace. Isolated Chromium verifies sign-in fixtures without signing the user out. Saved screenshots and actual-backdrop contrast JSON accompany this report. Run `pnpm exec playwright test --workers=2` from `frontend/` to reproduce browser artifacts.

Final full browser run: **71 passed, 0 failed (1.5 minutes)**. Minimum normal-copy actual-backdrop contrast: **4.7071:1** across eight light/dark cases.
