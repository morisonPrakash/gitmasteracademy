export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Strip inline markdown so text can be indexed or measured. */
export function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

/** Fisher-Yates shuffle that returns a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Normalise a typed command so equivalent answers compare equal:
 * trims, collapses whitespace, unifies quote style and drops a leading "$ ".
 */
export function normalizeCommand(input: string): string {
  return input
    .trim()
    .replace(/^\$\s*/, '')
    .replace(/[‘’“”]/g, '"')
    .replace(/'/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s*;\s*$/, '');
}

export function commandMatches(input: string, answers: string[]): boolean {
  const n = normalizeCommand(input);
  return answers.some((a) => normalizeCommand(a) === n);
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
