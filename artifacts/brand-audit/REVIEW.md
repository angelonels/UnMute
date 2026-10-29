# Colour and branding audit

Reviewed sign-in, workspace, meeting controls/gallery, Mumo panel, media preview, account/settings, shared Arc button, theme toggle, loading/fallback marks, inline logo, favicon, and sculpture materials. Primary implementation commits: `3825af1`, `7df40c0`, `fe9e292`.

| Severity | Root cause                                                                       | Fix                                                                                     |
| -------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| High     | Light theme explicitly selected a blue Mumo material while dark selected ceramic | Removed obsolete finish selection; one shared ceramic body and dark face in both themes |
| High     | SVG fallback used blue body/light face while auth locally overrode it            | Removed split paper/blue palette and auth exception; shared ceramic tokens everywhere   |
| Medium   | Three.js reaction effects used independent sky-blue and amber constants          | Resolve primary iris and supporting rose CSS tokens for reaction effects                |
| Medium   | Six unrelated participant palettes retained green, brown, sand, blue             | Preserve data keys but resolve decorative avatars into iris/rose/neutral families       |
| Medium   | Arc primary buttons used black while application primary actions used iris       | Shared primary button consumes primary/on-primary/hover tokens                          |
| Medium   | Selected Mumo control was rose while other selected controls were iris           | All selected controls share primary-soft/primary-ink; Mumo header is neutral            |
| Medium   | Development badge used warning amber without a warning                           | Neutral badge; preserve amber for raised-hand/reconnection states                       |
| Medium   | Synthetic media preview retained sage literals                                   | Preview uses the active primary-soft/primary-ink tokens                                 |
| Low      | Input, disabled, shadow neutrals retained old blue hue                           | Align to iris-neutral hue 282                                                           |

Logo geometry audit found identical inline/favicon U paths; the sculpture uses the same asymmetric arms and rose end. Retained that established identity. Physical ivory materials and Google/video colours remain intentional exceptions. The favicon responds to OS chrome while the app mark responds to app appearance; both use the corresponding defined iris/rose colour values.

## Verification approach

The new Mumo screenshot-pixel regression was written before implementation and reproduced the original problem: 26.6% strongly blue pixels in light mode. Final checks measure real rendered pixels, then force WebGL context loss and inspect the ceramic fallback. Semantic contrast includes primary, secondary, selected, status, and all participant foreground/background pairs in both themes. Meeting checks preserve red microphone/camera-off states and verify primary-selected Mumo controls. Captures wait for the gallery to finish reflowing, so evidence shows settled geometry.

`pnpm verify` passed formatting, lint, strict types, existing tests, generated contract consistency, and production builds. React Doctor remains 90/100 with existing AI control-flow complexity and object URL helper warnings; ownership callbacks were reviewed and no checks were suppressed. No Core Web Vitals trace or real Google OAuth flow was run. Existing lazy scene chunk and next-themes development warnings remain.

The built-in browser retains the real signed-in session and was used to inspect the corrected ceramic Mumo in light workspace. E2E runs in the isolated Chromium authorized by the user. No personal Chrome profile is accessed.

The durable colour-role guide is `docs/brand-system.md`. Reproduce with `pnpm verify`, `pnpm run doctor`, and `pnpm exec playwright test --workers=2` from `frontend/` for browser tests. Test screenshots and JSON measurements are saved alongside this report.

Final browser run: **75 passed, 0 failed (1.6 minutes)**. Source tested through `fe9e292`. All expanded semantic contrast pairs pass the unchanged 4.5:1 threshold. All eight actual-backdrop cases pass their original thresholds.

A final 3/3 targeted brand run also passed after adding explicit mobile canvas readiness before screenshot capture. The updated mobile evidence shows the loaded 3D character, while separate context-loss evidence covers its fallback.
