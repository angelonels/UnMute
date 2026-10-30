# Arc components

Button, Drawer, Chat thread, and Segmented control are vendored from the free MIT-licensed [Arc UI registry](https://uiarc.dev), retrieved 2026-10-27:

- [Button source](https://uiarc.dev/r/button.json) and [documentation](https://uiarc.dev/components/button/markdown)
- [Drawer source](https://uiarc.dev/r/drawer.json) and [documentation](https://uiarc.dev/components/drawer/markdown)
- [Chat thread source](https://uiarc.dev/r/chat-thread.json) and [documentation](https://uiarc.dev/components/chat-thread/markdown)
- [Segmented control source](https://uiarc.dev/r/segmented-control.json) and [documentation](https://uiarc.dev/components/segmented-control/markdown)
- [Shared motion presets](https://uiarc.dev/r/arc-motion-tokens.json)

The original license is included in `LICENSE`. Local adaptations use UnMute's semantic colors and spacing via `app/styles.css`, a 0.96 pointer press depth over 150ms, the existing ease-out curve, shorter panel presets, and larger drawer close targets. Component styling is expressed as Tailwind utility maps; no component CSS modules remain. Chat uses the quiet fade variant for frequent interactions, disables unused reactions/attachments, and labels local messages without claiming delivery. No Pro source is used.

The meeting layout uses Arc’s segmented control with instant selection because switching views is a frequent action. Chat attachment resources are cleaned up outside state updaters, and attachment/reaction groups fade without animating layout dimensions.

The shared SelectPicker used by device settings and all playground menus adapts the free [Select source](https://uiarc.dev/r/select.json), retrieved 2026-10-28, to Tailwind utilities and UnMute semantic surfaces. Radix Select owns keyboard navigation, typeahead, focus return, and collision handling. Pointer entry is 180ms; keyboard entry is immediate and reduced motion uses opacity only.
