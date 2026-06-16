// ABOUTME: Value object for canon-fact extraction output (one entry per atomic fact)
// ABOUTME: Providers validate parsed JSON via isValidExtractedCanonFact before trusting it

export interface ExtractedCanonFact {
  /** Known character name the fact is about */
  entity: string;
  /** The atomic fact, short (e.g. "est morte") */
  statement: string;
  /** 0-based chapter index where the fact becomes true */
  validFromChapter: number;
  /** Short quote/context backing the fact */
  evidence: string;
}

export interface CanonFacts {
  facts: ExtractedCanonFact[];
}

export function isValidExtractedCanonFact(value: unknown): value is ExtractedCanonFact {
  if (typeof value !== 'object' || value === null) return false;
  const f = value as Record<string, unknown>;
  if (typeof f.entity !== 'string' || f.entity.trim().length === 0) return false;
  if (typeof f.statement !== 'string' || f.statement.trim().length === 0) return false;
  if (
    typeof f.validFromChapter !== 'number' ||
    !Number.isInteger(f.validFromChapter) ||
    f.validFromChapter < 0
  ) {
    return false;
  }
  return true;
}
