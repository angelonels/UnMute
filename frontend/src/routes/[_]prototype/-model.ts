export const HUES = ['amber', 'teal', 'iris'] as const;
export const TONES = ['dim', 'elevated'] as const;
export const DENSITIES = ['comfortable', 'compact'] as const;
export const ROUNDNESSES = ['tighter', 'softer'] as const;
export const ELEVATIONS = ['border', 'shadow'] as const;
export const TYPEFACES = ['plex', 'instrument'] as const;

export type Hue = (typeof HUES)[number];
export type Tone = (typeof TONES)[number];
export type Density = (typeof DENSITIES)[number];
export type Roundness = (typeof ROUNDNESSES)[number];
export type Elevation = (typeof ELEVATIONS)[number];
export type Typeface = (typeof TYPEFACES)[number];

export type FoundationSearch = {
  hue?: Hue;
  tone?: Tone;
  density?: Density;
  roundness?: Roundness;
  elevation?: Elevation;
  type?: Typeface;
  sheet?: 'light';
};

export const HUE_OPTIONS = [
  {
    id: 'amber',
    label: 'Amber',
    why: 'Reads on skin, slides, and busy frames without Zoom-blue.',
  },
  {
    id: 'teal',
    label: 'Teal',
    why: 'Cool signal color that stays distinct from faces.',
  },
  {
    id: 'iris',
    label: 'Iris',
    why: 'Product-ownable accent; still luminous on dim glass.',
  },
] as const satisfies ReadonlyArray<{ id: Hue; label: string; why: string }>;

export const TONE_OPTIONS = [
  {
    id: 'dim',
    label: 'Dim overlay',
    why: 'Near-black glass. Status stays readable on a loud frame.',
  },
  {
    id: 'elevated',
    label: 'Elevated gray',
    why: 'Lifted chrome. Separates UI from video without going ink.',
  },
] as const satisfies ReadonlyArray<{ id: Tone; label: string; why: string }>;

export const DENSITY_OPTIONS = [
  {
    id: 'comfortable',
    label: 'Comfortable',
    why: 'Room to tap when the call is the job.',
  },
  {
    id: 'compact',
    label: 'Compact',
    why: 'More stage, less chrome on dense multi-tile calls.',
  },
] as const satisfies ReadonlyArray<{ id: Density; label: string; why: string }>;

export const ROUNDNESS_OPTIONS = [
  {
    id: 'tighter',
    label: 'Tighter',
    why: 'Technical, packed controls. More instrument than consumer.',
  },
  {
    id: 'softer',
    label: 'Softer',
    why: 'Friendlier tiles and dialogs on long sessions.',
  },
] as const satisfies ReadonlyArray<{ id: Roundness; label: string; why: string }>;

export const ELEVATION_OPTIONS = [
  {
    id: 'border',
    label: 'Border-first',
    why: 'Edges, not glow. Holds up on a moving camera feed.',
  },
  {
    id: 'shadow',
    label: 'Light shadow',
    why: 'Soft lift. Popovers and modals stack in three depths.',
  },
] as const satisfies ReadonlyArray<{ id: Elevation; label: string; why: string }>;

export const TYPE_OPTIONS = [
  {
    id: 'plex',
    label: 'IBM Plex',
    ui: 'IBM Plex Sans',
    cue: 'IBM Plex Mono',
    why: 'Broadcast / control-room. Mono keeps AI cues tabular.',
  },
  {
    id: 'instrument',
    label: 'Instrument',
    ui: 'Instrument Sans',
    cue: 'Instrument Serif',
    why: 'Warmer product voice. Serif marks the AI as a speaker.',
  },
] as const satisfies ReadonlyArray<{
  id: Typeface;
  label: string;
  ui: string;
  cue: string;
  why: string;
}>;

const KEYS = [
  'hue',
  'tone',
  'density',
  'roundness',
  'elevation',
  'type',
  'sheet',
] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function parseFoundationSearch(search: Record<string, unknown>): FoundationSearch {
  return {
    hue: pick(search.hue, HUES),
    tone: pick(search.tone, TONES),
    density: pick(search.density, DENSITIES),
    roundness: pick(search.roundness, ROUNDNESSES),
    elevation: pick(search.elevation, ELEVATIONS),
    type: pick(search.type, TYPEFACES),
    sheet: search.sheet === 'light' ? 'light' : undefined,
  };
}

export function compactSearch(search: FoundationSearch): FoundationSearch {
  const next: FoundationSearch = {};
  for (const key of KEYS) {
    const value = search[key];
    if (value != null) {
      next[key] = value as never;
    }
  }
  return next;
}

export function toggleSearchValue<K extends keyof FoundationSearch>(
  search: FoundationSearch,
  key: K,
  value: NonNullable<FoundationSearch[K]>,
): FoundationSearch {
  return compactSearch({
    ...search,
    [key]: search[key] === value ? undefined : value,
  });
}

export function selectedFoundationsJson(search: FoundationSearch): string {
  return JSON.stringify(
    {
      hue: search.hue ?? null,
      tone: search.tone ?? null,
      density: search.density ?? null,
      roundness: search.roundness ?? null,
      elevation: search.elevation ?? null,
      type: search.type ?? null,
      sheet: search.sheet ?? null,
    },
    null,
    2,
  );
}
