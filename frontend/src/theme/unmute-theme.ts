import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { unmuteIcons } from './unmute-icons';

export const unmuteAccent: [light: string, dark: string] = ['#A8D83A', '#C7F14B'];

export const unmuteTheme = defineTheme({
  name: 'unmute',
  extends: neutralTheme,
  icons: unmuteIcons,
  color: {
    accent: unmuteAccent,
    neutralStyle: 'neutral',
    contrast: 'standard',
  },
  localTokens: {
    '--astryx-theme-neutral-color-status-fill-accent': unmuteAccent,
    '--astryx-theme-neutral-color-status-fill-success': ['#087A42', '#63E6A5'],
    '--astryx-theme-neutral-color-status-fill-warning': ['#855A00', '#FFD166'],
    '--astryx-theme-neutral-color-status-fill-error': ['#B4233D', '#FF7088'],
    '--astryx-theme-neutral-color-status-muted-accent': [
      'rgba(168, 216, 58, 0.2)',
      'rgba(199, 241, 75, 0.18)',
    ],
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
  radius: { base: 5, multiplier: 1 },
  motion: {
    fast: 150,
    medium: 240,
    slow: 480,
    ratio: 0.72,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  tokens: {
    '--radius-inner': '6px',
    '--radius-element': '10px',
    '--radius-container': '18px',
    '--radius-page': '24px',
    '--radius-chat': '20px',
    '--size-element-sm': '34px',
    '--size-element-md': '42px',
    '--size-element-lg': '48px',
    '--color-accent': ['#A8D83A', '#C7F14B'],
    '--color-accent-muted': ['rgba(168, 216, 58, 0.2)', 'rgba(199, 241, 75, 0.18)'],
    '--color-text-accent': ['#557100', '#D5FF5F'],
    '--color-icon-accent': ['#638500', '#C7F14B'],
    '--color-on-accent': ['#172200', '#172200'],
    '--color-background-body': ['#F0F3F7', '#070A10'],
    '--color-background-surface': ['#FAFBFD', '#0C111A'],
    '--color-background-card': ['#FFFFFF', '#111824'],
    '--color-background-popover': ['#FFFFFF', '#182131'],
    '--color-background-muted': ['#E8EDF3', '#0A0F18'],
    '--color-text-primary': ['#111722', '#F5F7FA'],
    '--color-text-secondary': ['#536174', '#A9B4C4'],
    '--color-text-disabled': ['#7A8795', '#788493'],
    '--color-border': ['rgba(17, 23, 34, 0.12)', 'rgba(218, 230, 248, 0.13)'],
    '--color-border-emphasized': ['#C8D1DE', '#354258'],
    '--color-overlay': ['rgba(17, 23, 34, 0.48)', 'rgba(3, 6, 12, 0.78)'],
    '--color-shadow': ['rgba(31, 42, 60, 0.16)', 'rgba(0, 0, 0, 0.52)'],
    '--color-success': ['#087A42', '#63E6A5'],
    '--color-success-muted': ['rgba(8, 122, 66, 0.14)', 'rgba(99, 230, 165, 0.16)'],
    '--color-on-success': ['#FFFFFF', '#082219'],
    '--color-warning': ['#855A00', '#FFD166'],
    '--color-warning-muted': ['rgba(133, 90, 0, 0.14)', 'rgba(255, 209, 102, 0.16)'],
    '--color-on-warning': ['#FFFFFF', '#2B1805'],
    '--color-error': ['#B4233D', '#FF7088'],
    '--color-error-muted': ['rgba(180, 35, 61, 0.13)', 'rgba(255, 112, 136, 0.16)'],
    '--color-on-error': ['#FFFFFF', '#300B0C'],
    '--shadow-low': [
      '0 1px 2px rgba(31, 42, 60, 0.08), 0 6px 16px rgba(31, 42, 60, 0.05)',
      '0 1px 2px rgba(0, 0, 0, 0.38), 0 8px 18px rgba(0, 0, 0, 0.22)',
    ],
    '--shadow-med': [
      '0 2px 5px rgba(31, 42, 60, 0.08), 0 14px 34px rgba(31, 42, 60, 0.12)',
      '0 2px 5px rgba(0, 0, 0, 0.38), 0 16px 38px rgba(0, 0, 0, 0.34)',
    ],
    '--shadow-high': [
      '0 4px 10px rgba(31, 42, 60, 0.1), 0 28px 64px rgba(31, 42, 60, 0.18)',
      '0 4px 10px rgba(0, 0, 0, 0.46), 0 30px 72px rgba(0, 0, 0, 0.5)',
    ],
  },
  components: {
    button: {
      base: {
        borderRadius: 'var(--radius-element)',
        transition:
          'transform var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)',
        ':active': { transform: 'scale(0.975)' },
      },
    },
    card: {
      base: {
        borderRadius: 'var(--radius-container)',
      },
    },
    'clickable-card': {
      base: {
        borderRadius: 'var(--radius-container)',
        transition:
          'transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
        ':active': { transform: 'scale(0.985)' },
      },
    },
    'selectable-card': {
      base: {
        borderRadius: 'var(--radius-container)',
        transition:
          'transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
        ':active': { transform: 'scale(0.985)' },
      },
    },
    popover: {
      base: {
        borderRadius: 'var(--radius-container)',
        boxShadow: 'var(--shadow-med)',
      },
    },
    dialog: {
      base: {
        borderRadius: 'var(--radius-page)',
        boxShadow: 'var(--shadow-high)',
      },
    },
    tooltip: {
      base: {
        borderRadius: 'var(--radius-inner)',
        boxShadow: 'var(--shadow-low)',
      },
    },
  },
  adaptations: {
    rules: [
      {
        when: { pointer: 'coarse' },
        value: {
          tokens: {
            '--size-element-sm': '38px',
            '--size-element-md': '44px',
            '--size-element-lg': '50px',
          },
        },
      },
      {
        when: { motion: 'reduce' },
        value: {
          tokens: {
            '--duration-fast-min': '0ms',
            '--duration-fast': '0ms',
            '--duration-fast-max': '0ms',
            '--duration-medium-min': '0ms',
            '--duration-medium': '0ms',
            '--duration-medium-max': '0ms',
          },
        },
      },
    ],
  },
  onDark: {
    tokens: {
      '--color-on-accent': '#172200',
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
