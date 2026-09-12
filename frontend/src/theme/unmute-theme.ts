/**
 * Locked UnMute foundations from /_prototype/foundations:
 * hue amber · tone dim · density comfortable · roundness softer
 * elevation shadow · type IBM Plex · dark-first, light sheet kept.
 *
 * Locked in-call stage from /_prototype/call-shell:
 * hybrid equal-gallery + optional spotlight. Pin is never assumed.
 */
import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

export const unmuteTheme = defineTheme({
  name: 'unmute',
  extends: neutralTheme,
  color: {
    accent: ['#C4850A', '#F0B429'],
    neutralStyle: 'neutral',
    contrast: 'standard',
  },
  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: 'IBM Plex Sans',
      fallbacks: 'ui-sans-serif, system-ui, sans-serif',
    },
    heading: {
      family: 'IBM Plex Sans',
      fallbacks: 'ui-sans-serif, system-ui, sans-serif',
      weight: 'semibold',
    },
    code: {
      family: 'IBM Plex Mono',
      fallbacks: 'ui-monospace, monospace',
    },
  },
  radius: { base: 6, multiplier: 1 },
  motion: {
    fast: 160,
    medium: 280,
    slow: 500,
    ratio: 0.75,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  tokens: {
    '--radius-inner': '8px',
    '--radius-element': '12px',
    '--radius-container': '16px',
    '--radius-page': '22px',
    '--radius-chat': '22px',
    '--size-element-sm': '32px',
    '--size-element-md': '40px',
    '--size-element-lg': '48px',
    '--color-on-accent': ['#FFF8E8', '#1A1304'],
    '--color-background-body': ['#ECECEE', '#070708'],
    '--color-background-surface': ['#FAFAFC', '#0E0E11'],
    '--color-background-card': ['#FFFFFF', '#121216'],
    '--color-background-popover': ['#FFFFFF', '#1A1A1F'],
    '--color-background-muted': ['#F4F4F5', '#0A0A0C'],
    '--color-text-primary': ['#18181B', '#F4F4F5'],
    '--color-text-secondary': ['#52525B', '#A1A1AA'],
    '--color-text-disabled': ['#A1A1AA', '#71717A'],
    '--color-border': ['rgba(24, 24, 27, 0.12)', 'rgba(255, 255, 255, 0.12)'],
    '--color-border-emphasized': ['#D4D4D8', '#3F3F46'],
    '--color-overlay': ['rgba(24, 24, 27, 0.45)', 'rgba(7, 7, 8, 0.72)'],
    '--color-shadow': ['rgba(24, 24, 27, 0.12)', 'rgba(0, 0, 0, 0.45)'],
    '--shadow-low': [
      '0 1px 2px rgba(24, 24, 27, 0.12)',
      '0 1px 2px rgba(0, 0, 0, 0.28)',
    ],
    '--shadow-med': [
      '0 8px 24px rgba(24, 24, 27, 0.16)',
      '0 8px 24px rgba(0, 0, 0, 0.34)',
    ],
    '--shadow-high': [
      '0 18px 40px rgba(24, 24, 27, 0.2)',
      '0 18px 40px rgba(0, 0, 0, 0.42)',
    ],
  },
  components: {
    button: {
      base: {
        borderRadius: 'var(--radius-element)',
        transition:
          'transform var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)',
        ':active': { transform: 'scale(0.97)' },
      },
    },
    card: {
      base: {
        borderRadius: 'var(--radius-container)',
      },
    },
  },
  onDark: {
    tokens: {
      '--color-on-accent': '#1A1304',
    },
    components: {
      button: {
        'variant:ghost': {
          borderWidth: '1px',
          borderStyle: 'solid',
        },
      },
    },
  },
});
