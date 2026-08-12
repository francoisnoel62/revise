// ABOUTME: A grammar remark the author has declined for a project.
// ABOUTME: Identified by rule family and flagged text, so it stays declined wherever it recurs.

import type { TextIssue } from './TextIssue';

/**
 * Position is deliberately absent: the author is waving away a remark, not a
 * place in the manuscript. Text moves; the judgement holds.
 */
export interface IgnoredGrammarIssue {
  ruleFamily: string;
  text: string;
}

export function toIgnoredGrammarIssue(issue: TextIssue): IgnoredGrammarIssue {
  return { ruleFamily: issue.ruleFamily ?? '', text: issue.text.trim() };
}

export function isIgnoredGrammarIssue(
  issue: TextIssue,
  declined: readonly IgnoredGrammarIssue[]
): boolean {
  const candidate = toIgnoredGrammarIssue(issue);
  return declined.some(
    (entry) => entry.ruleFamily === candidate.ruleFamily && entry.text === candidate.text
  );
}
