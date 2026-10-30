# User direction and delivery checklist

This records the cumulative direction for this refinement, including later corrections.

- [x] Work on a separate branch and commit regularly: `polish/frontend-mumo-refinement`.
- [x] Use independent agents for design, rendering, interaction, engine, and verification reviews where useful.
- [x] Apply better-ui, Emil design engineering, Apple design, animation review, and web performance principles.
- [x] Use the approved generated studio reference as the visual direction.
- [x] Replace the old blue/green/brown direction with iris and restrained rose, expressed through OKLCH semantic tokens.
- [x] Tune both themes; preserve readable text against actual backdrops.
- [x] Remove surplus slogans, repeated explanations, and internal illustration labels.
- [x] Remove unused workspace information and side-panel UI.
- [x] Put the account avatar and name at bottom left; offer Settings and Sign out through its menu.
- [x] Improve navigation collapse, mobile drawer, keyboard focus, and enlarged text behavior.
- [x] Fix the login flash when returning from a meeting.
- [x] Render the U with real depth and Mumo in one shared scene.
- [x] Give the U a fixed cinematic view with no pointer/touch response.
- [x] Keep Mumo independently interactive and honor reduced motion.
- [x] Align shared lighting, rounded ceramic material, rose terminal, floor contact, and Mumo’s contact with the U.
- [x] Remove clipped rectangular floor-shadow edges.
- [x] Align the brand silhouette with the sculpture’s rounded asymmetric U and attached terminal.
- [x] Give seated Mumo more happy, curious, surprised, and excited body language.
- [x] Optimize lazy loading, geometry reuse, lifecycle cleanup, and adaptive phone/desktop quality.
- [x] Read the Arc skill; use it when touching Arc components. Avoid unnecessary component replacement.
- [x] Complete the full project and browser verification after the identity/personality changes (53 browser tests).
- [x] Refine loading feedback across session restoration, auth retry, navigation, media, meeting preview, and AI responses.
- [x] Re-run project and browser verification after the loading-state refinement (61 browser tests).
- [x] Save final screenshots and reports.
- [x] Leave the application running at `http://localhost:5173/` with a retained preview tab.

Browser review uses the built-in Codex browser. E2E uses the isolated Playwright Chromium explicitly authorized by the user. Personal Chrome profiles are untouched.

- [x] Refine phone portrait, compact screens, tablet, and landscape composition in both themes.
- [x] Tint near-white light surfaces toward iris using low-chroma OKLCH neutrals; remeasure actual backdrop contrast.
- [x] Complete project verification and all 71 browser cases after mobile/color refinement.

- [x] Reduce light-mode glare further across canvas/panels, deepen accents and footer ink, and verify all 71 browser cases again. See `../soft-light-refinement/REVIEW.md`.

- [x] Audit brand, character materials, avatar palettes, primary/selected controls, preview colours, and status colours across both themes. Fix blue Mumo and unify shared tokens; verify 75 browser cases. See `../brand-audit/REVIEW.md` and `docs/brand-system.md`.

- [x] Refine studio floor grounding, cast/contact shadows, dark ceramic lighting, and logo curves/small-size rose tip; verify 75 existing browser cases and two new logo cases. See `../studio-grounding/REVIEW.md`.
