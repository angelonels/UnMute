# Frontend verification

Date: 2026-10-28. Branch: `feat/meeting-room`. Source: `31edae1`.

## Automated checks

- `pnpm verify`: passed formatting, ESLint with zero allowed warnings, frontend/backend typechecks, all four existing tests, generated-contract check, and both production builds.
- `pnpm --filter @unmute/frontend run doctor`: 81/100, zero errors and 14 warnings. Remaining findings concern component complexity/size, one mixed export, a small ref initializer, and object URL warnings. The two object URL findings have explicit revoke paths on removal and unmount in the Arc chat implementation; no rules were disabled.
- Request-only Playwright auth checks: two passed; machine-readable output in `playwright-api.json`. These checks do not launch a browser.
- Production bundle search found no demo participant names, synthetic-camera marker, or demo-controls marker.
- Vite reports a chunk-size advisory for the lazy-loaded Three.js scene (approximately 140 KB gzipped).

## Browser checks

Used the Codex in-app browser only. Verified the authenticated workspace and its prejoin/meeting/leave flow, gallery capacities for 1/2/6/48 participants, page clamping, pin/focus, panel exclusivity and coexistence, chat drafts, sample AI replies, keyboard Escape/focus return, and light/dark themes. Earlier media checks exercised explicit synthetic camera, silent microphone, screen capture, browser-ended sharing, denial recovery, and video playback (readyState 4, muted, playing). Physical camera/microphone and the native screen picker were not exercised by the agent.

The final design pass checked 320px and approximately 390px narrow layouts, desktop layouts, and both themes. Prior room checks also covered 768/1024/1440px. No horizontal overflow was observed. Live WebGL canvases reported `data-renderer=webgl`; captured frames differed without pointer interaction. The floating pause control is absent. The persistent animation preference is in device settings; reduced motion is supported. Empty-panel auto-scrolling was corrected after the final short-screen inspection.

Standalone browser-launch Playwright UI specs, including the new companion specs, were not run: verification stayed in the permitted in-app browser instead of launching an unrelated Chromium profile. Those specs remain repeatable for a configured CI browser. Do not interpret the request-only Playwright results as a pass of the complete UI suite.

## Repeatable review

1. Run `pnpm dev` and open `/meeting?demo=true&microphone=false&camera=false` in the in-app browser.
2. Open AI, chat, and people. Toggle gallery/focus; pin someone; use the playground for 1/2/6/48 participants and page through the gallery.
3. In playground capture controls choose synthetic devices, turn camera/mic on, share, then simulate the browser ending sharing. Use denial mode to inspect error recovery.
4. Inspect the autonomous companion without dragging. In device settings disable/re-enable companion animation, then inspect system reduced motion.
5. Resize to 320/390/768/1024/1440px and switch themes. Use keyboard Escape to close a panel and verify return focus.
6. Enter the normal workspace with a valid session and use Start meeting; the normal room has no fixture participants or simulated AI response.

Screenshots in this folder are browser verification artifacts. `desktop-*`, `mobile-*`, `signin-*`, and `workspace-compact-*` capture the visual pass; `local-capture-dark.png` and `mobile-chat-light.png` preserve the earlier functional media/chat checks. These are implementation evidence, not research assets. No external research files are in the repository.
