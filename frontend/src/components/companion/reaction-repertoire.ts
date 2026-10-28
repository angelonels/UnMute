/** Event-owned choices: each stimulus remembers its last performance, never rerolling per frame. */
export function createReactionRepertoire(random: () => number = Math.random) {
  const previous = new Map<string, number>();
  return {
    next(stimulus: string): number {
      const sample = random();
      const unit = Number.isFinite(sample) ? Math.max(0, Math.min(0.999999, sample)) : 0;
      const last = previous.get(stimulus);
      const candidate = Math.floor(unit * (last === undefined ? 4 : 3));
      const choice = last !== undefined && candidate >= last ? candidate + 1 : candidate;
      previous.set(stimulus, choice);
      return choice;
    },
  };
}

// Four performances of the same emotion: buoyant, inquisitive, bashful, and bright.
export const REACTION_PERFORMANCES = [
  { side: -1, travel: 4, tilt: -6, lift: 3, pace: 1.12, width: 1.08, height: 0.95, duration: 1.1 },
  { side: 1, travel: 7, tilt: 9, lift: 1.5, pace: 0.92, width: 0.94, height: 1.08, duration: 1.5 },
  { side: -1, travel: 2.5, tilt: 4, lift: 2, pace: 1.2, width: 0.92, height: 0.88, duration: 1.3 },
  { side: 1, travel: 5, tilt: -4, lift: 4, pace: 1.04, width: 1.05, height: 1.12, duration: 0.95 },
] as const;
