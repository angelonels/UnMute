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

## Motion and component refinement — 2026-10-28

Source commits: `9306f70`, `20c26c8`, `c2ce251`, `8168c51` on `feat/meeting-room`.

- Final `pnpm verify` passed after the mixed-input button fix: formatting, zero-warning ESLint, strict frontend/backend typechecks, all four existing tests, generated contracts, and both production builds.
- React Doctor: 81/100 with 15 warnings. Complexity/size and mixed-export findings remain advisory. The object URL findings have explicit cleanup paths. The Button presence warning concerns switching to immediate keyboard rendering, where removing the animation wrapper is intentional. The media ref initializer creates a small empty resource record; it performs no capture or external work. No checks were disabled.
- The lazy Three.js scene still triggers Vite's chunk advisory: approximately 560.6 KB minified / 140.4 KB gzip.
- Added repeatable motion E2E scenarios in `frontend/e2e/motion.spec.ts` before their implementation. Standalone browser-launch Playwright specs remain unrun because review used the permitted Codex in-app browser. Browser interaction checks below are separate from a Playwright CLI suite pass.

Verified in the in-app browser:

- Keyboard device-settings opening is immediate; Escape returns focus to its trigger.
- Both custom device pickers expose the expected options, selected check, keyboard navigation, and Escape focus return. Default-device aliases are deduplicated. The menu remained within the 320px viewport.
- Own chat messages render immediately after Enter. AI suggestion activation transfers focus to its composer as the welcome content leaves.
- Workspace prejoin and side drawer open by keyboard and return focus on Escape. Switching from keyboard activation back to pointer activation opens the prejoin on the first click after the shared Button fix.
- Pointer theme switching drives thumb translation plus sun/moon rotation, scale, and opacity. Keyboard switching is immediate. Live reduced-motion emulation changed an open modal between `reduced` and `pointer` without reloading. Temporary emulation was cleared.
- Meeting and workspace renders checked in light/dark themes at desktop and 320 CSS pixels. No horizontal overflow was observed. Compact prejoin fits the narrow viewport.
- Compact AI toolbar uses the real dimensional companion; larger autonomous companion rendering remains active. No floating pause control was added.

The current review tab logged the existing React warning emitted by next-themes' client-rendered script; no capture or application exception was observed in this pass. Physical camera/microphone and the native screen-share picker were not repeated; earlier explicit synthetic media checks remain recorded above. Meeting transport and live AI integration remain outside this frontend scope.

`polished-*` PNGs capture this refinement pass. They are verification artifacts, not research. External references and research remain in the temporary directory outside the repository.

## Picker, companion startup, and Iconoir pass — 2026-10-28

- Removed the Companion animation setting and its local-storage override. The procedural scene now follows system reduced motion directly.
- All four playground menus use the shared SelectPicker, promoted from DevicePicker. No native select controls remain in `frontend/src`. Verified 48-person count, a scrollable speaker list, speaker changes, Ready/Reconnecting connection changes, capture-source changes, Escape/focus return, and 320px collision handling in both themes.
- Companion module loading starts before visibility observation; the detailed fallback remains visible until the first real frame. Removed the 200ms canvas opacity transition. GPU setup yields until after the control has painted and scheduled work is cancelled on unmount. Real canvases reported `webgl`, visible, with a zero-second opacity transition. Two direct CDP captures of the companion under reduced motion were identical. Screenshot emulation and viewport overrides were cleared afterward.
- Replaced all Lucide imports and removed `lucide-react`. Iconoir uses explicit SVG dimensions and a consistent 1.5px stroke. The animated chat control now wraps Iconoir's ChatBubbleEmpty; original layout diagrams, brand artwork, and 3D mascot remain custom. Documented Iconoir as the default for future icons in the icons README.
- Final `pnpm verify` passed all checks and production builds after the migration. React Doctor completed at 80/100 with the same 15 advisory findings described above; no rules were suppressed. The lazy Three.js scene retains its approximately 140 KB gzip chunk advisory.
- Updated existing Playwright specs to use custom listbox options and assert the removed setting/system motion state. Standalone Playwright UI specs were not run; interactions were exercised through the permitted Codex in-app browser. Physical device capture was not repeated for this visual pass.
- Final Iconoir controls were checked at desktop and 320 CSS pixels in both themes, with no horizontal overflow at 320px. New screenshots include `iconoir-*`, `playground-*`, and `device-settings-simplified-dark.png`. Earlier screenshots remain historical verification artifacts.

## Streaming, Dotty and Mumo second pass — 2026-10-28

Source commits: `2c70433`, `d529eb9`, `c149a22`, followed by the fresh-browser review fixes on `feat/meeting-room`.

- The requested Ponytail audit identified remembered-device selection, initial media preference cleanup, People→Chat switching, and stale workspace assertions. Those are corrected. Deferred synthetic media checks in the permitted in-app browser confirmed selected-camera reuse after off/on, preservation of an existing live track when replacement fails, and disposal of late capture after leaving. Physical devices were not used.
- Mumo replaces the visible UnMute AI name. Its panel has a dedicated character stage, concise context, starter cards, formatted streamed answers, stop/retry/copy, persistent drafts and reader-controlled scrolling. The shared theme toggle is one custom sun/crescent silhouette. Meeting panel triggers moved beside the lower call controls so the header preserves stage space.
- Dotty's MIT source and notice are retained. All 9 states, 27 shapes, 12 expressions and 7 effect kinds feed a genuine closed Three.js volume. The development Companion studio exposes the full range, Poke and Blink. Production bundles exclude the studio and response/device fixtures. Framing checks sampled all 243 shape/state combinations; intrinsic normalization keeps long ears and tall silhouettes in view. Two reduced-motion canvas captures were identical. No animation override or drag-to-rotate control exists.
- Mumo's behavior resolver uses actual local UI events. Focus/edit draws attention down toward the composer; attention expires after five seconds. Waiting, chunks, completion, interruption and reading older answers select deliberate reactions. Autonomous glances, blinks, breathing, turns and periodic stretches resume between interactions. `mumo-response-lifecycle.json` records thinking→working→celebrating→wandering; `mumo-attention-lifecycle.json` records attentive→composing→wandering. It never consumes captured audio.
- Actual ReadableStream chunk handling was checked for interrupted partial answers, retry without duplicate prompts, stop, copy and retained drafts. The isolated stream tests cover cancellation during acquisition/read, late acquisition, empty/oversized responses and a cancellation promise that never resolves. An injected stream source remains the future transport boundary; no model/backend service is simulated in normal previews.
- The one-time fresh-context GPT-6.1 Terra review explored both themes, workspace/prejoin, personal/demo meetings, 1/48 participants, paging/pinning, chat, device menus, Mumo normal/interrupted/empty/stop/retry, keyboard focus and short screens. It found three reproducible issues: oversized short-screen character header, Stop/Retry focus loss, and explicit submissions failing to reveal the new exchange while reading history. All three were fixed and independently rechecked live. The full review and before/after screenshots remain outside the repository in `/tmp/unmute-fresh-review/`.
- In-app browser layout measurements at 320, 375, 768, 1024, 1440 and 1618 CSS pixels in both themes reported zero horizontal overflow. Narrow sheets and the lower two-row call tools were visually checked. Short-height Mumo now uses a 64px character stage instead of 144px. Explicit sends/retries reveal the response; passive streaming preserves older reading position. Escape restores panel-opener focus.
- A 60-sample browser rAF cadence check with visible 144px and 44px Mumo canvases and 4× desktop CPU throttling measured 8.3ms median, 9.4ms p95, 41.3ms maximum. This is browser scheduling evidence, not GPU render timing or a physical mobile-device benchmark. CPU throttling and media/viewport emulation were reset after review.
- `pnpm verify` passed formatting, zero-warning ESLint, strict typechecks, 3 backend tests, 12 frontend tests, generated-contract checks and both builds after the contextual behavior implementation. The final review fixes also passed the full verification run before commit. React Doctor scored 81/100 with 17 advisories: complexity/size, Arc mixed exports and intentional keyboard-presence behavior, two object-URL cleanup false positives (cleanup paths inspected), and a cheap media ref initializer. No checks were weakened or suppressed. The lazy Three.js chunk remains about 143 KB gzip and triggers Vite's minified-size advisory.
- Repeatable Playwright scenarios cover the updated labels, stream lifecycle, device persistence/late capture, all companion states, contextual attention, keyboard focus and short-panel scrolling, with screenshot artifacts. Standalone Playwright UI-suite execution remains unrun; browser flows were exercised through the permitted Codex in-app browser rather than launching an unapproved browser profile. Relevant E2E TypeScript sources were checked separately. Real OAuth, physical camera/microphone/native screen-share chooser, deployed traffic, peer delivery, transcription and live model integration were not exercised in this pass.

`mumo-*`, `ai-interrupted-dark.png`, `dotty-thinking-dark.png` and `companion-celebration.mp4` are verification captures. Research and audit prose remain in `/tmp`.
