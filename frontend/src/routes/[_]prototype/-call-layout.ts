export type Size = { w: number; h: number };

export type EqualLayout = {
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
};

export type SpotlightFrame = {
  side: boolean;
  main: Size;
  strip: Size;
};

const ASPECT = 16 / 9;

/** Matches Astryx `--spacing-2` (8px) used as tile gap in the prototype CSS. */
export const TILE_GAP = 8;

export function equalTileLayout(
  count: number,
  width: number,
  height: number,
  gap: number,
  aspect = ASPECT,
): EqualLayout {
  if (count <= 0 || width <= 0 || height <= 0) {
    return { cols: 1, rows: 1, tileW: 0, tileH: 0 };
  }

  let best: EqualLayout = { cols: 1, rows: count, tileW: 0, tileH: 0 };

  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const tileW = (width - gap * (cols - 1)) / cols;
    const tileH = (height - gap * (rows - 1)) / rows;
    const fittedW = Math.min(tileW, tileH * aspect);
    const fittedH = fittedW / aspect;
    if (fittedW * fittedH > best.tileW * best.tileH) {
      best = { cols, rows, tileW: fittedW, tileH: fittedH };
    }
  }

  return best;
}

export function spotlightUsesSideStrip(otherCount: number, width: number, height: number): boolean {
  return otherCount > 0 && otherCount <= 3 && width > height * 1.2;
}

export function spotlightFrame(
  otherCount: number,
  width: number,
  height: number,
  gap = TILE_GAP,
): SpotlightFrame {
  const side = spotlightUsesSideStrip(otherCount, width, height);
  if (side) {
    const stripW = Math.min(240, Math.max(160, Math.round(width * 0.2)));
    return {
      side: true,
      main: { w: Math.max(0, width - stripW - gap), h: height },
      strip: { w: stripW, h: height },
    };
  }
  const stripH = Math.min(168, Math.max(104, Math.round(height * 0.2)));
  return {
    side: false,
    main: { w: width, h: Math.max(0, height - stripH - gap) },
    strip: { w: width, h: stripH },
  };
}
