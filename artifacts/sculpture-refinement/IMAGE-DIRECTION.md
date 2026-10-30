# Approved image direction

The user selected the generated light studio composition: an ivory ceramic U, a rose glazed terminal, Mumo resting in the counter, lavender daylight, open ivory space, oversized restrained typography, and one iris sign-in action. The implementation retains that composition while replacing the foreground poster with an interactive WebGL sculpture.

The built-in image generator produced the reference and separate production assets. These are reproducible descriptions of the selected prompts, rather than a transcript of every exploratory request.

## Light reference

Create a premium desktop sign-in interface for UnMute. On the left, a large three-dimensional ivory ceramic U with rounded substantial edges and a gently sloping rose-colored top on its shorter right arm. A small friendly white pebble companion with two dark eyes rests inside the U. Soft lavender daylight, window shadows, a matte studio floor, and a seamless fade into warm ivory space on the right. Minimal UnMute identity at top left, a restrained theme toggle at top right. The right column has large black typography reading “Sign in to UnMute”, the subtitle “Meet, talk, be here.”, one iris-purple Continue with Google button, and a small meeting playground link. Editorial spacing and realistic material depth; no cards or decorative labels.

## Dark reference

Translate the approved composition to a charcoal studio with muted lavender window light. Keep the ceramic object luminous and tangible, with a restrained rose terminal. Preserve the same clean hierarchy and iris action with legible light typography.

## Production assets

- `frontend/public/images/auth-studio-light.webp`: empty light lavender studio background, soft window light and floor, fading to ivory on the right. No objects, UI, lettering, or logos.
- `frontend/public/images/auth-studio-dark.webp`: equivalent empty charcoal and lavender studio. No objects, UI, lettering, or logos.
- `frontend/public/images/auth-sculpture.webp`: transparent ivory ceramic U with a rose glazed terminal, no companion, text, UI, or background. Used as the loading and WebGL-unavailable poster.
- `frontend/public/images/auth-sculpture-small.webp`: responsive 480px poster export.

Original generated images remain in `/Users/angelonelson/.codex/generated_images/01a18715-2b9f-7ef0-bbe2-3a89222a0f8c/`. The approved light reference is `exec-ee66acf6-13c2-4580-a94d-8368ef4cc387.png`; the dark reference is `exec-a35cbbf6-a2fe-48b8-98cc-af2320dd96f9.png`. Production backdrop exports came from `exec-e03dd6e1-4c56-4f82-92d8-5728bd88f891.png` and `exec-baface7b-5fd4-4946-a218-0829ce601be9.png`.
