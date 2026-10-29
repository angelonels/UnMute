import { describe, expect, it } from 'vitest';
import { createReactionRepertoire } from './reaction-repertoire';

// Failures: repeated greetings, shared memory between stimuli, rerender-driven rerolls,
// invalid random input, or variants that confuse concern with celebration.
describe('Mumo reaction repertoire', () => {
  it('never immediately repeats a performance, even with a constant random source', () => {
    const repertoire = createReactionRepertoire(() => 0);
    const variants = Array.from({ length: 20 }, () => repertoire.next('hello'));
    for (let i = 1; i < variants.length; i++) expect(variants[i]).not.toEqual(variants[i - 1]);
  });
  it('remembers each stimulus independently and only advances on an explicit event', () => {
    const repertoire = createReactionRepertoire(() => 0);
    const first = repertoire.next('typing');
    repertoire.next('success');
    expect(repertoire.next('typing')).not.toEqual(first);
  });
  it('offers four bounded performances without changing semantic emotion', () => {
    for (const random of [0, 0.3, 0.6, 0.999, NaN, Infinity, -2, 2]) {
      const choice = createReactionRepertoire(() => random).next('error');
      expect(choice).toBeGreaterThanOrEqual(0);
      expect(choice).toBeLessThan(4);
      expect(Number.isInteger(choice)).toBe(true);
    }
  });
});
