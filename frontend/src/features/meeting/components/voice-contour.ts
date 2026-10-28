/** A periodic silhouette: integer harmonics and cyclic tangents keep the seam invisible. */
export function voiceContour(levels: ArrayLike<number>, phase: number) {
  const bands = Array.from({ length: 4 }, (_, i) => {
    const value = levels[i] ?? 0;
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  });
  const energy = Math.max(...bands);
  const weight = bands.reduce((sum, band, i) => sum + band * [0.48, 0.28, 0.16, 0.08][i]!, 0);
  const time = Number.isFinite(phase) ? phase : 0;
  const harmonics = [3, 4, 6, 8];
  const weights = [0.48, 0.28, 0.16, 0.08];
  const points = Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2;
    const wave = bands.reduce(
      (sum, band, j) =>
        sum +
        band *
          weights[j]! *
          Math.cos(angle * harmonics[j]! + time * (j % 2 ? -1 : 1) * (0.6 + j * 0.3)),
      0,
    );
    const radius = 57 + Math.sqrt(energy) * (9 + (weight > 0 ? wave / weight : 0) * 8);
    return { x: 80 + Math.cos(angle) * radius, y: 80 + Math.sin(angle) * radius };
  });
  const point = (i: number) => points[(i + points.length) % points.length]!;
  const xy = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
  let path = `M${xy(point(0).x, point(0).y)}`;
  for (let i = 0; i < points.length; i++) {
    const a = point(i - 1),
      b = point(i),
      c = point(i + 1),
      d = point(i + 2);
    path += `C${xy(b.x + (c.x - a.x) / 6, b.y + (c.y - a.y) / 6)} ${xy(c.x - (d.x - b.x) / 6, c.y - (d.y - b.y) / 6)} ${xy(c.x, c.y)}`;
  }
  return { path: `${path}Z`, energy };
}
