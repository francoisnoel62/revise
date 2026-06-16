// ABOUTME: Provenance of a canon fact — derived (AI-extracted) or author (written/edited by the author).
// ABOUTME: Enables refutability: author facts survive re-extraction; derived facts may be replaced.

export const CANON_FACT_SOURCES = ['derived', 'author'] as const;

export type CanonFactSource = (typeof CANON_FACT_SOURCES)[number];

export function isValidCanonFactSource(value: string): value is CanonFactSource {
  return (CANON_FACT_SOURCES as readonly string[]).includes(value);
}
