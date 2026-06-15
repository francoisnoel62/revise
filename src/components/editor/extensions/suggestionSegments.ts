// ABOUTME: Pure helpers to split a suggestion into the next word or next fragment
// ABOUTME: Used by partial acceptance (Ctrl+→ = word, Alt+→ = fragment); framework-agnostic

export interface Segment {
  /** The leading slice to insert (includes attached spaces / punctuation). */
  take: string;
  /** The remaining suggestion after `take`. */
  rest: string;
}

/**
 * Next word: leading whitespace + one word + trailing whitespace.
 * Preserves FR typography (JS \s matches NBSP and other Unicode spaces).
 */
export function nextWord(suggestion: string): Segment {
  if (!suggestion) return { take: '', rest: '' };
  const match = suggestion.match(/^\s*\S+\s*/);
  const take = match ? match[0] : suggestion;
  return { take, rest: suggestion.slice(take.length) };
}

/**
 * Next fragment: up to and including the next strong boundary (. , ; : ! ? — or newline),
 * plus trailing whitespace. Falls back to the whole string if no boundary is found.
 */
export function nextFragment(suggestion: string): Segment {
  if (!suggestion) return { take: '', rest: '' };
  const match = suggestion.match(/^[\s\S]*?[.,;:!?—\n]\s*/);
  const take = match ? match[0] : suggestion;
  return { take, rest: suggestion.slice(take.length) };
}
