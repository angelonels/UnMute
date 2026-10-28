export type Participant = {
  id: string;
  name: string;
  role: string;
  tone: 'sage' | 'clay' | 'lavender' | 'slate' | 'sand' | 'rose';
  microphone: boolean;
  camera: boolean;
  hand: boolean;
  self?: boolean;
};
export type MeetingMessage = { id: string; authorId: string; text: string; createdAt: string };
export type Connection = 'ready' | 'reconnecting' | 'offline';
export type MediaPreferences = {
  microphone: boolean;
  camera: boolean;
  sharing: boolean;
  hand: boolean;
  captions: boolean;
};
export const initialMedia: MediaPreferences = {
  microphone: false,
  camera: false,
  sharing: false,
  hand: false,
  captions: false,
};

export { personInitials as initials } from '../../lib/person-initials';

/** Gallery order stays stable while capacity follows the usable stage, including open panels. */
export function galleryGeometry(width: number, height: number, count: number) {
  const columns = width < 520 ? 1 : width < 840 ? 2 : width < 1240 ? 3 : 4;
  const rows = Math.max(1, Math.min(width < 520 ? 2 : 3, Math.floor((height + 12) / 170)));
  const capacity = Math.min(12, columns * rows);
  const visible = Math.min(count, capacity);
  let bestColumns = 1;
  let bestArea = 0;
  for (let candidate = 1; candidate <= Math.min(columns, visible); candidate++) {
    const rowCount = Math.ceil(visible / candidate);
    if (rowCount > rows) continue;
    const tileWidth = (width - (candidate - 1) * 12) / candidate;
    const tileHeight = (height - (rowCount - 1) * 12) / rowCount;
    const area =
      Math.min(tileWidth, tileHeight * 1.6) *
      Math.min(tileHeight, tileWidth / 1.6) *
      (1 - (candidate * rowCount - visible) * 0.04);
    if (area > bestArea) {
      bestArea = area;
      bestColumns = candidate;
    }
  }
  return { capacity, columns: bestColumns };
}

export function focusOrder(
  people: Participant[],
  pinnedId: string | null,
  speakerId: string,
  excludeId?: string,
) {
  const ids = new Set([pinnedId, speakerId, ...people.map((person) => person.id)]);
  return [...ids].flatMap((id) => {
    const person = people.find((entry) => entry.id === id);
    return person && person.id !== excludeId ? [person] : [];
  });
}

const counts = new Intl.NumberFormat();
export const formatCount = (count: number) => counts.format(count);
