// ABOUTME: A single writing issue located in a chapter, whatever engine found it.
// ABOUTME: One shape for spelling and grammar so the editor keeps a single ordered list.

export type TextIssueNature = 'spelling' | 'grammar';

/**
 * A positioned issue in a chapter. `from` and `to` are absolute ProseMirror
 * positions, so a range can be decorated and replaced without further mapping.
 * Plain data: it crosses the Server Action boundary and lives in editor state.
 */
export interface TextIssue {
  nature: TextIssueNature;
  /** Absolute ProseMirror position of the first flagged character. */
  from: number;
  /** Absolute ProseMirror position just after the last flagged character. */
  to: number;
  /** The flagged text, as it read when the issue was found. */
  text: string;
  /** What is wrong, in the author's language. Empty for a plain misspelling. */
  message: string;
  suggestions: string[];
  /** Grammar-engine rule family (`gn`, `conj`, …). Absent for spelling. */
  ruleFamily?: string;
}

/**
 * Author-facing category of an issue. Named categories are the second signal
 * carrying the nature of an issue, so it never rests on the underline colour
 * alone.
 */
const GRAMMAR_CATEGORIES: Readonly<Record<string, string>> = {
  gn: 'Accord',
  ppas: 'Accord',
  conj: 'Conjugaison',
  infi: 'Conjugaison',
  imp: 'Conjugaison',
  inte: 'Conjugaison',
  vmode: 'Conjugaison',
  conf: 'Confusion',
  esp: 'Ponctuation',
  nbsp: 'Ponctuation',
  virg: 'Ponctuation',
  poncfin: 'Ponctuation',
};

export function textIssueCategory(issue: TextIssue): string {
  if (issue.nature === 'spelling') return 'Orthographe';
  return GRAMMAR_CATEGORIES[issue.ruleFamily ?? ''] ?? 'Grammaire';
}
