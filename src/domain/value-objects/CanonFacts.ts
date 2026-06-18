// ABOUTME: Value object for canon-fact extraction output (one entry per atomic fact)
// ABOUTME: Providers validate parsed JSON via isValidExtractedCanonFact before trusting it

export type CanonFactCategory = 1 | 2 | 3 | 4 | 5;

export interface ExtractedCanonFact {
  /** Known character name the fact is about */
  entity: string;
  /** The atomic fact, short (e.g. "est morte") */
  statement: string;
  /** 0-based chapter index where the fact becomes true */
  validFromChapter: number;
  /** Short quote/context backing the fact */
  evidence: string;
  /**
   * One of the 5 narrative categories:
   * 1=objectif, 2=état de connaissance, 3=croyance, 4=croyance sur ce que les autres savent, 5=dynamique relationnelle
   * Defaults to 1 when not provided.
   */
  category?: CanonFactCategory;
  /**
   * Statement of a prior belief this fact contradicts. When set, the prior belief
   * with the same entity and this statement receives a validToChapter.
   */
  invalidates?: string;
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
  if (f.category !== undefined && ![1, 2, 3, 4, 5].includes(f.category as number)) return false;
  return true;
}
