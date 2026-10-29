/** Motion presets are shared by the gallery and future registry consumers. */
export const motionTokens = {
  duration: { instant: 0.15, fast: 0.16, exit: 0.18, standard: 0.24, considered: 0.25 },
  ease: {
    enter: [0.23, 1, 0.32, 1],
    exit: [0.23, 1, 0.32, 1],
    standard: [0.23, 1, 0.32, 1],
    /** For elements that move while already on screen. */
    inOut: [0.77, 0, 0.175, 1],
  },
  spring: {
    responsive: { type: 'spring', stiffness: 520, damping: 44 },
    gentle: { type: 'spring', stiffness: 340, damping: 34 },
    /** Presses, toggles, thumbs, and small indicators. Settles fast and never overshoots, so nothing jitters. */
    snappy: { type: 'spring', duration: 0.3, bounce: 0 },
    /** Panels, height changes, and layout shifts. Critically damped, never overshoots. */
    smooth: { type: 'spring', duration: 0.3, bounce: 0 },
    /** Shape morphs, shared layout highlights, and width changes that follow new content. No bounce: sizes and positions settle without overshoot. */
    morph: { type: 'spring', duration: 0.32, bounce: 0 },
  },
  /** Stagger steps in seconds. Keep total stagger under roughly 0.4s. */
  stagger: { char: 0.016, word: 0.04, line: 0.08, item: 0.035 },
  /** Blur radii in px for text and content crossfades. Keep blur small and brief. */
  blur: { subtle: 2, soft: 4, text: 8 },
} as const;
