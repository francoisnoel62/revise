// ABOUTME: Shared helpers to build the canon-facts request and parse/validate the LLM JSON output
// ABOUTME: Keeps extraction validation identical across Anthropic, OpenAI and Google providers

import { CanonFacts, isValidExtractedCanonFact } from '@/domain/value-objects/CanonFacts';

/**
 * Build the user message: the known cast followed by the full manuscript.
 * The chapter order in fullText defines the 0-based validFromChapter index.
 */
export function buildCanonFactsUserMessage(fullText: string, characterNames: string[]): string {
  const cast = characterNames.length > 0 ? characterNames.join(', ') : '(aucun)';
  return `PERSONNAGES CONNUS: ${cast}\n\n---\n\n${fullText}`;
}

/**
 * Parse and validate a canon-facts JSON payload. Drops malformed entries rather
 * than throwing on a single bad fact, but throws if the overall shape is invalid.
 */
export function parseCanonFactsJson(jsonContent: string): CanonFacts {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    throw new Error('Failed to parse canon facts response');
  }

  if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as { facts?: unknown }).facts)) {
    throw new Error('Invalid response: facts must be an array');
  }

  const rawFacts = (parsed as { facts: unknown[] }).facts;
  const facts = rawFacts.filter(isValidExtractedCanonFact).map((f) => ({
    entity: f.entity.trim(),
    statement: f.statement.trim(),
    validFromChapter: f.validFromChapter,
    evidence: typeof f.evidence === 'string' ? f.evidence : '',
  }));

  return { facts };
}
