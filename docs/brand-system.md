# UnMute colour and identity system

The semantic source of truth is `frontend/src/app/styles.css`. Interface components consume its Tailwind tokens. The Three.js character resolves the same CSS material and accent tokens into sRGB at scene setup and theme changes; it never converts colours per animation frame.

| Role            | Tokens                                                         | Use                                                        |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Primary iris    | `primary`, `on-primary`, `primary-hover`                       | Main actions and links                                     |
| Selected iris   | `primary-soft`, `primary-ink`                                  | Active navigation, selected controls, decorative avatars   |
| Supporting rose | `secondary`, `on-secondary`, `secondary-soft`, `secondary-ink` | Logo terminal and restrained decorative identity accents   |
| Surfaces        | `canvas`, `surface`, `surface-raised`, `surface-muted`         | Low-chroma iris-neutral hierarchy                          |
| Content         | `text`, `muted`, `disabled`, `input`                           | Text and control boundaries; never unrelated blue neutrals |
| Success green   | `success`                                                      | Speaking, active screen share, connected device            |
| Attention amber | `warning`                                                      | Raised hand, reconnecting, actionable caution              |
| Red             | `error`, `on-error`                                            | Muted microphone, camera off, failures, Leave              |
| Ceramic         | `companion-body`, `companion-face`, related material tokens    | Mumo in every theme, size, renderer, and fallback          |

Status also has a label, icon, pressed state, or announcement. Do not use green/amber/red as decorative participant colours or a badge for the development playground. Decorative participant keys remain compatible with existing room data but resolve into iris, rose, or neutral families.

Primary hue is 282 degrees in OKLCH; secondary is rose around 350 degrees. Light canvas and panels remain at lightness 0.94 and 0.958 to avoid glaring white surfaces. Dark mode changes surface and accent lightness for legibility. Mumo stays ivory ceramic with a dark face: a theme change affects lighting and surroundings, never the character's identity.

The inline logo and favicon share the rounded asymmetric U paths, including the attached rose terminal. The large studio sculpture uses that same tall-left/short-right silhouette in ceramic. Perspective and physical lighting are intentional differences between the sculpture and the flat mark. The favicon uses OS light/dark media styles for browser-chrome readability; the app mark follows the selected app theme.

Google's official multicolour mark, black video letterboxing, white video overlays, and physical light colours are intentional exceptions. Material lighting colours are not interface accent colours.

Before shipping palette changes, run the semantic contrast and actual-backdrop E2E cases, material-pixel/context-loss tests, and phone/desktop theme screenshots. Contrast checks must include avatar inks, status inks, selected controls, and on-colour action labels. Do not relax thresholds to preserve a colour.
