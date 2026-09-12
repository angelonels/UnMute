/**
 * Throwaway in-call shell search params.
 * Compact: omit people when 5, speaker when gallery (nobody spotlighted).
 * speaker=0 is You in spotlight and must stay in the URL.
 */
export const PEOPLE_MIN = 1;
export const PEOPLE_MAX = 12;
export const PEOPLE_DEFAULT = 5;

export type CallShellSearch = {
  sheet?: 'light';
  people?: number;
  speaker?: number;
};

export type ResolvedCallShellSearch = {
  sheet?: 'light';
  people: number;
  speaker: number | null;
};

function parseIntInRange(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(n) || n < min || n > max) {
    return undefined;
  }
  return n;
}

export function parseCallShellSearch(search: Record<string, unknown>): CallShellSearch {
  return {
    sheet: search.sheet === 'light' ? 'light' : undefined,
    people: parseIntInRange(search.people, PEOPLE_MIN, PEOPLE_MAX),
    speaker: parseIntInRange(search.speaker, 0, PEOPLE_MAX - 1),
  };
}

export function resolveCallShellSearch(search: CallShellSearch): ResolvedCallShellSearch {
  const people = search.people ?? PEOPLE_DEFAULT;
  const speaker =
    search.speaker === undefined ? null : Math.min(Math.max(search.speaker, 0), people - 1);
  return {
    sheet: search.sheet,
    people,
    speaker,
  };
}

export function compactCallShellSearch(search: ResolvedCallShellSearch): CallShellSearch {
  const next: CallShellSearch = {};
  if (search.sheet === 'light') {
    next.sheet = 'light';
  }
  if (search.people !== PEOPLE_DEFAULT) {
    next.people = search.people;
  }
  if (search.speaker !== null) {
    next.speaker = search.speaker;
  }
  return next;
}

export function clampSpotlight(speaker: number | null, people: number): number | null {
  if (speaker === null) {
    return null;
  }
  if (people <= 0) {
    return null;
  }
  return Math.min(speaker, people - 1);
}

