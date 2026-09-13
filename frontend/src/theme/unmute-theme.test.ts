import { resolveThemeTokens } from '@astryxdesign/core/theme/tokens';
import { describe, expect, it } from 'vitest';
import { unmuteAccent, unmuteTheme } from './unmute-theme';

describe('UnMute theme contract', () => {
  it('keeps the dark-first studio hierarchy and product motion', () => {
    const tokens = resolveThemeTokens(unmuteTheme, { mode: 'dark' });

    expect(tokens['--color-background-body']).toBe('#070A10');
    expect(tokens['--color-background-surface']).toBe('#0C111A');
    expect(tokens['--color-background-card']).toBe('#111824');
    expect(tokens['--color-background-popover']).toBe('#182131');
    expect(unmuteAccent).toEqual(['#A8D83A', '#C7F14B']);
    expect(tokens['--color-accent']).toBe('#C7F14B');
    expect(tokens['--color-on-accent']).toBe('#172200');
    expect(tokens['--color-success']).toBe('#63E6A5');
    expect(tokens['--size-element-md']).toBe('42px');
    expect(tokens['--ease-standard']).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  });

  it('keeps the light studio sheet crisp and readable', () => {
    const tokens = resolveThemeTokens(unmuteTheme, { mode: 'light' });

    expect(tokens['--color-background-body']).toBe('#F0F3F7');
    expect(tokens['--color-background-card']).toBe('#FFFFFF');
    expect(tokens['--color-text-primary']).toBe('#111722');
    expect(unmuteAccent).toEqual(['#A8D83A', '#C7F14B']);
    expect(tokens['--color-accent']).toBe('#A8D83A');
    expect(tokens['--color-on-accent']).toBe('#172200');
  });
});
