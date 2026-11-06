/**
 * World names stay in English, but people may type them on a Turkish keyboard, so dotted and
 * dotless i count as the same letter and accents are ignored.
 */
export function normalizeForSearch(text: string): string {
  return text
    .replace(/[ıİI]/g, 'i')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(name: string, query: string): boolean {
  return normalizeForSearch(name).includes(normalizeForSearch(query));
}
