import { describe, expect, it } from 'vitest';
import { voiceContour } from './voice-contour';

// Failures: a seam at the wrap, intrusion into the avatar, clipped peaks,
// nonfinite remote levels, sound-independent motion, or a silhouette insensitive to spectrum.
const endpoints = (path: string) => {
  const curves = path.split('C');
  return [
    curves[0]!.slice(1).split(',').map(Number),
    ...curves
      .slice(1)
      .map((curve) => curve.replace('Z', '').trim().split(/[ ,]+/).slice(-2).map(Number)),
  ];
};
describe('closed voice contour', () => {
  it('closes exactly and keeps every peak outside the avatar and inside its frame', () => {
    for (const levels of [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0.1, 1, 0.4, 0.9],
    ]) {
      for (const phase of [0, 1.2, 18.3]) {
        const shape = voiceContour(levels, phase);
        const points = endpoints(shape.path);
        expect(shape.path.endsWith('Z')).toBe(true);
        expect(points.at(-1)).toEqual(points[0]);
        for (const [x, y] of points) {
          const radius = Math.hypot(x! - 80, y! - 80);
          expect(radius).toBeGreaterThan(56.9);
          expect(radius).toBeLessThan(74.1);
        }
      }
    }
  });
  it('rests during silence and changes with the actual spectrum', () => {
    expect(voiceContour([], 0)).toEqual(voiceContour([0, 0, 0, 0], 9));
    expect(voiceContour([1, 0, 0, 0], 1).path).not.toBe(voiceContour([0, 0, 0, 1], 1).path);
    expect(voiceContour([1, 0, 0, 0], 1).path).not.toBe(voiceContour([1, 0, 0, 0], 2).path);
  });
  it('clamps invalid samples without producing invalid SVG geometry', () => {
    const shape = voiceContour([NaN, Infinity, -10, 10], NaN);
    expect(shape.path).not.toMatch(/NaN|Infinity/);
    expect(shape.energy).toBe(1);
  });
});
