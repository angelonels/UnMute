# Mumo companion

The character uses Roy Barber’s MIT-licensed [Dotty Botty](https://github.com/roybarber/dotty-botty) 1.0.0 engine. `LICENSE.dotty` preserves the upstream notice. `dotty-engine.ts` retains its nine states, twenty-seven shapes, twelve expressions, blinks, autonomous glances, poke spring, shape morphing, state blending and seven effect kinds.

Local changes add explicit composer/answer attention, a brief autonomous idle stretch, a numeric frame callback, strict bounded-array assertions, a browser API fallback, and a scheduler that stops when every character is hidden or still. Keep those differences explicit when updating upstream. SVG strings are generated only from this trusted numerical engine; application/user text never enters its markup.

`scene.ts` turns the same frame into a closed Three.js volume. Shape rings, eye contours and effect meshes reuse GPU buffers. The renderer does not parse SVG or upload a new texture each frame. Lighting uses a ceramic/blue material and a warm accent for sparks. There is no drag interaction. The character looks around and rotates autonomously; poke adds a brief burst. System reduced motion shows one settled frame, including after state changes. Hidden/offscreen characters stop rendering, and disposal releases observers, the engine, buffers, textures, materials and the WebGL context.

`AICompanion` selects the numeric 3D renderer for large or explicitly dimensional instances and the original Dotty SVG for compact marks and immediate fallback. Its optional handle exposes `poke()` and `blink()`. Do not nest a pokeable character in another button.

The conversation maps waiting → thinking, streamed chunks → working, completion → one celebration, error → a short alert, then cheerful idle. It never implies that AI is listening to locally captured audio. All official states, shapes and expressions can be inspected in the development playground’s Companion studio. Production builds exclude that inspector.

Interface context is resolved in `features/meeting/companion-behavior.ts`. Typing/focus briefly owns composer attention; reading older text owns answer attention. Attention overrides autonomous glances and turns, blends eye direction and body pitch, and expires after inactivity. These signals describe local UI interaction only.
