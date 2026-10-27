# Meeting room: frontend interaction design

This pass implements local interface behavior. It does not capture devices, connect peers, transmit chat, transcribe speech, or call a model. The normal meeting preview contains only the signed-in user. Development fixtures are available only behind Vite's development flag and the explicit `demo=true` search parameter.

## Information hierarchy

1. People or shared content occupy the stage. Meeting chrome stays quiet.
2. A bottom control dock always exposes microphone, camera, share, hand, captions, and leave. Red off states never resemble the blue brand action.
3. UnMute AI lives on the left and meeting chat/people on the right. A panel's close control stays in its header and restores focus to its opener.
4. The header identifies the room and explicitly labels the preview. It also exposes gallery/focus selection, themes, AI, and chat.

## Colour contracts

| Meaning                                    | Treatment                         | Additional signal                                       |
| ------------------------------------------ | --------------------------------- | ------------------------------------------------------- |
| Brand, primary action, selected navigation | Cobalt                            | Label / selected state                                  |
| Mic/camera off                             | Red on a soft red surface         | Slashed icon and off label                              |
| Device preference on                       | Neutral                           | Unslashed icon and on label                             |
| Active speaker / sharing                   | Green                             | Speaking label / sharing banner                         |
| Raised hand / reconnecting                 | Amber                             | Hand icon / reconnecting label                          |
| Disconnected / leave / failure             | Red                               | Status text / phone-down icon                           |
| AI scope / chat visibility                 | Neutral                           | Private / everyone labels                               |
| Participant identity                       | Muted clay, sage, lavender, slate | Initials and name; these colours never imply call state |

An amber decorative dot beside general footer copy can be mistaken for a warning. Replace it with a neutral brand mark; decorative artwork may retain brand colours. Preview-only informational notices use neutral surfaces. Existing authentication errors already use the error token.

## Participant selection and density

- Gallery ordering is stable join order. Speech does not reorder cards. Each page is bounded by available stage width and height, with at most twelve visible people, six at medium widths, and two at phone widths. All others remain reachable through pagination and a searchable people list.
- One participant fills the stage; two are balanced side by side when space permits; larger calls use even grid tracks. A last partial row does not stretch one face disproportionately.
- The gallery's minimum useful tile size, stage height, open panels, and captions determine capacity. A ResizeObserver measures the actual stage, not just the browser width. Resizing clamps the displayed page so it cannot become empty.
- In focus mode, a manually pinned participant takes precedence over the active speaker, then the first available participant. Exactly one pin is supported; a second pin replaces it. Pinning selects focus mode. Removing a pin returns to the live speaker in focus mode.
- Screen sharing always occupies the main stage. Pinning affects the accompanying participant strip, never replaces the shared content.
- Focus/share filmstrip priority is pinned person, active speaker, then stable join order, with duplicates removed. The main focus participant is excluded from their own strip. Pagination keeps every participant reachable.
- A speaker on another gallery page is surfaced through a “Show speaker” action. The page never changes on its own while someone is reading it.
- If demo population shrinks, vanished speaker/pin ids fall back immediately to existing participants. The state does not produce blank stages.

## Panels, chat, and local state

- At 1440px and above, both side panels may be open together. Below that, opening one closes the other. Below 1024px, panels are modal sheets with focus containment, Escape, and a dimmed background. Desktop panels are nonmodal, do not dismiss on routine stage interaction, and use contained scrolling.
- Chat and people share the right panel, with explicit tab buttons. Unsent draft and message history survive closing a panel. Messages are local and labelled accordingly. There are no simulated delivery/read receipts.
- The composer accepts Enter to send and Shift+Enter for a line break, respects IME composition, rejects empty input, bounds message length, and preserves draft when unavailable. No file controls are shown before attachments work.
- AI has a distinct private scope, suggestion prompts, a local conversation, and clear sample-answer labels in demo mode. It never implies that a model listened to the meeting. Normal preview prompts receive an explicit unavailable response.
- Chat logs have polite additions announcements. Auto-scroll follows new messages only when the reader is near the bottom; otherwise a jump-to-latest action appears. Local histories are bounded to avoid an unbounded DOM.
- Captions use labelled fixture text in the development demo and an unavailable state in a normal preview. Hand, mic, camera, and share controls change local preferences only.
- Leaving produces an ended view with explicit rejoin and workspace actions. Rejoin begins a fresh local room state; no destructive global “end for everyone” control exists without real authorization.

## Motion contract

Panel open/close is an occasional action serving spatial consistency: transform and opacity only, 240ms strong ease-out on entrance and 150ms on exit, mirrored paths. Transitions are interruptible and controls never lock during motion. Reduced motion uses a short fade. Keyboard-initiated panel actions are instant.

Mic, camera, captions, tabs, speech highlights, chat input, paging, and participant changes are frequent actions. They update immediately, with no staged entrances, orbiting avatars, continuous ambient effects, or bouncing controls. Pointer press feedback is 0.96 over 150ms, gated by motion preference and excluded from keyboard focus. Theme changes suppress colour transitions. Layout changes are not animated through width, height, or grid tracks.

## Development playground

The dev-only entry is `/meeting?demo=true`. Fixtures contain no real account or conversation data. Controls expose 1/2/6/12/24/48-person rooms, explicit speaker selection, connection states, and reset. Sharing, pinning, panels, chat, and captions are exercised through the real interface controls. The playground and seed conversations must disappear from production bundles. There is also an entry link on the development login and workspace pages.

## Failure cases and verification

Before implementation, the key failure cases are: off states shown as brand selection; missing keyboard labels/focus return; page overflow at 320px; a dock hidden by a sheet or text wrapping; an empty page after shrinking the room; a pinned person dropping out on paging; one person duplicated on stage and filmstrip; sharing displaced by a pin; panels squeezing all tiles to thumbnails; drafts lost on panel close; whitespace/IME accidentally sent; messages interpreted as HTML; sample AI answers confused with live inference; reconnecting/disconnected shown as healthy; device permissions requested by a frontend demo; demo fixtures bundled in production; and animation ignoring reduced motion.

Use browser E2E flows to inspect one, two, six, and many participants; pin/unpin across pages; focus/gallery/share; both panels; local AI/chat; network states; leave/rejoin; themes; narrow/short/wide screens; keyboard Escape/focus; and reduced motion. Save screenshots and a repeatable inspection record. Run `pnpm verify`, React Doctor, and the applicable Playwright checks; report unrun checks explicitly.
