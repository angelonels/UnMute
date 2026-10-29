# Loading-state refinement

Loading feedback now covers initial session restoration and route transitions, Google sign-in, session retry, camera/microphone permission, screen selection, first video playback and buffering, meeting preview, AI waiting/streaming, and clipboard completion.

The shared indicator uses semantic color and stops rotating under reduced motion. Buttons preserve dimensions and, where an operation begins on that control, keyboard focus. Pending actions prevent duplicate activation. Session retry remains in place; only the first unresolved identity uses a neutral branded page. No fake progress percentages or forced minimum waits were introduced.

The meeting preview uses the installed Arc Button loading API. Existing Arc components retain their behavior and styling. Its device status occupies reserved space, and entering the meeting waits for requested capture to settle. Native meeting controls retain focus with aria-disabled while capture is pending. Per-source synchronous guards also prevent duplicate capture requests.

Mumo has a quiet reserved answer placeholder before the first token, distinct Thinking and Writing feedback, a single response announcement, and Copying feedback bound to the clipboard promise. Partial responses, Stop, Retry, and drafts remain intact. The 3D scene retains its existing image/SVG loading and context-loss fallback.

## Verification

The final full Playwright run passed all 61 tests in 2.5 minutes with two workers, without retries. Project verification passed formatting, lint, strict types, existing tests, generated contracts, and both production builds. React Doctor remains 90/100 with the two previously reviewed warnings recorded in the sculpture report. Real OAuth completion and Chrome DevTools/Core Web Vitals measurement were not performed.

Screenshots show both themes of session loading, Google connection, session retry, camera permission, screen selection, meeting preview loading, AI response progress, completed response, and pending clipboard completion. The AI progress screenshot shows streaming; the E2E also verifies the short pre-token Thinking state before capture.

Repeat with `pnpm verify`, `pnpm --filter @unmute/frontend exec playwright test --workers=2 --reporter=list,html`, and `pnpm run doctor` from the repository root.
