# Arc components

Button and Drawer are vendored from the free MIT-licensed [Arc UI registry](https://uiarc.dev), retrieved 2026-10-27:

- [Button source](https://uiarc.dev/r/button.json) and [documentation](https://uiarc.dev/components/button/markdown)
- [Drawer source](https://uiarc.dev/r/drawer.json) and [documentation](https://uiarc.dev/components/drawer/markdown)
- [Shared motion presets](https://uiarc.dev/r/arc-motion-tokens.json)

The original license is included in `LICENSE`. Local adaptations use UnMute's semantic colors and spacing via `app/styles.css`, a fixed 0.96 press depth, the existing ease-out curve, shorter panel presets, and larger drawer close targets. CSS modules are retained for these upstream components; product layouts use Tailwind utilities. No Pro source is used.
