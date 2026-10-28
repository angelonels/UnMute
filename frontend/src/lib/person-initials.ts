const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const suffixes = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);

/** Use visible name graphemes, excluding standalone emoji and common generational suffixes. */
export function personInitials(name: string) {
  const words = name.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’\u2010-\u2015-]*/gu) ?? [];
  if (words.length > 1 && suffixes.has(words.at(-1)!.toLowerCase())) words.pop();
  if (!words.length) return '?';
  const first = (word: string) => [...graphemes.segment(word)][0]?.segment ?? '';
  const parts =
    words.length === 1
      ? [...graphemes.segment(words[0]!)].slice(0, 2).map((part) => part.segment)
      : [first(words[0]!), first(words.at(-1)!)];
  return parts.join('').toLocaleUpperCase();
}
