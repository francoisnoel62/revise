// ABOUTME: Pure entity detection for canon selection — known cast names intersected with local text
// ABOUTME: No NER: matches whole-word occurrences of known character names (case-insensitive, Unicode)

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Return the subset of knownNames that appear as whole words in the given text.
 * Order follows knownNames; each name is returned at most once.
 */
export function detectEntities(text: string, knownNames: string[]): string[] {
  if (!text || knownNames.length === 0) return [];

  const found: string[] = [];
  const seen = new Set<string>();

  for (const name of knownNames) {
    const trimmed = name.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    // Whole-word match using Unicode letter boundaries (so "Léa" does not match "Léane").
    const pattern = new RegExp(`(?<!\\p{L})${escapeRegExp(trimmed)}(?!\\p{L})`, 'iu');
    if (pattern.test(text)) {
      found.push(trimmed);
      seen.add(key);
    }
  }

  return found;
}
