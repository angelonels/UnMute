import { describe, expect, it } from 'vitest';
import { personInitials } from './person-initials';

// Failure cases: split surrogate pairs/ZWJ emoji, suffixes mistaken for surnames,
// whitespace-only identities, combining marks split, and one-word names truncated incorrectly.
describe('person initials', () => {
  it.each([
    ['👩🏽‍💻 Amara Okafor', 'AO'],
    ['🦊 Fox', 'FO'],
    ['Jo', 'JO'],
    ['J', 'J'],
    ['Christopher Alexander Montgomery III', 'CM'],
    ['  Sam   Lee ', 'SL'],
    ['王秀英', '王秀'],
    ['Ólafur Darri Ólafsson', 'ÓÓ'],
    ['Đặng Thị Ngọc Hân', 'ĐH'],
    ['A\u0301na Pérez', 'A\u0301P'],
    ['   ', '?'],
  ])('%s → %s', (name, expected) => expect(personInitials(name)).toBe(expected));
});
