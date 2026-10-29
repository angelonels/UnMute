# Workspace frontend review

Reviewed in the Codex in-app browser on 2026-10-27 and 2026-10-28. Workspace screenshots use a temporary local session fixture for Alex Morgan (`alex@example.test`). The fixture is outside the repository and does not create a real account or change authentication.

## Verified

- Login: light and dark themes at desktop and mobile sizes.
- Workspace: light and dark themes at 320, 375, 768, 1024, 1440, and 2560 CSS pixels; no horizontal overflow. Measurements are in `responsive-checks.json`.
- Desktop navigation collapses to an icon rail and expands again.
- Desktop side panel opens alongside the content at wide sizes and closes through its close button and Escape.
- Mobile navigation opens as an accessible drawer. Escape dismisses it and returns focus to its trigger.
- Meeting preview opens from Start meeting, toggles microphone and camera preferences, and returns focus to Start meeting on Escape.
- Signing out through the temporary fixture returns to the login page.
- Reduced motion: side panel opens without a transform; the opacity variant and dismissal work.
- Existing Playwright request-only auth tests pass: hostile-origin/redirect rejection and Google identity scope/callback binding (2 tests).

## Automated regression coverage

`frontend/e2e/workspace.spec.ts` covers panel and preview keyboard behavior, responsive themes, reduced motion, and sign-out failure recovery. Run `pnpm --filter @unmute/frontend test:e2e` in an authorized browser environment. The CLI browser suite was not launched during this review because repository instructions permit only the Codex browser or the specified personal Chrome profile. UI interactions above were exercised using Playwright through the Codex browser instead. All 7 tests were successfully discovered with `playwright test --list`.

`pnpm verify` covers formatting, lint, both runtime type checks, existing unit tests, generated contract consistency, and production builds. React Doctor reports 86/100, with two full Motion import warnings and two complexity warnings in the vendored Arc Button and Drawer. No checks were disabled.

## Reproduce the visual review

1. Run `pnpm dev` and open `http://localhost:5173` in the Codex browser or the authorized Chrome profile.
2. Review the login page in both themes, then sign in to reach the workspace.
3. Collapse and expand navigation, open and dismiss the side panel, and open Start meeting.
4. Toggle preview preferences, then press Escape and check that focus returns to Start meeting.
5. Repeat at mobile width and with the reduced-motion preference enabled.

Meeting transport, device activation, invitations, and future side-panel content are intentionally outside this frontend pass. Real-device gesture feel and a frame-by-frame 10% speed motion inspection were not verified.
