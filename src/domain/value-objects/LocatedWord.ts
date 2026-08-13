// ABOUTME: A word found in a chapter, with the range it occupies in the document.
// ABOUTME: What the spell checker is handed and what its answers are placed back onto.

import type { TextIssue } from './TextIssue';

/**
 * A word and where it sits.
 *
 * `from` and `to` are absolute ProseMirror positions, like everywhere else a range is
 * carried, so a misspelling can be underlined and replaced without further mapping.
 * Positions are located again after every round trip: the author goes on writing while a
 * check is in flight, and a range read from the document as it was would put the correction
 * on the wrong text.
 */
export interface LocatedWord {
  word: string;
  /** Absolute ProseMirror position of the first character. */
  from: number;
  /** Absolute ProseMirror position just after the last character. */
  to: number;
}

/**
 * A word carries at least two letters or combining marks. A single letter has no spelling
 * to judge, and punctuation is not the spell checker's business.
 */
export const WORD_PATTERN = /[\p{L}\p{M}]{2,}/gu;

/** Every distinct word in a piece of text, with its position offset by `start`. */
export function locateWords(text: string, start: number): LocatedWord[] {
  const located: LocatedWord[] = [];
  WORD_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = WORD_PATTERN.exec(text)) !== null) {
    located.push({
      word: match[0],
      from: start + match.index,
      to: start + match.index + match[0].length,
    });
  }

  return located;
}

/** The issue a misspelling becomes once the dictionary has answered for it. */
export function spellingIssueAt(
  located: LocatedWord,
  suggestions: readonly string[]
): TextIssue {
  return {
    nature: 'spelling',
    from: located.from,
    to: located.to,
    text: located.word,
    // A misspelling says what is wrong by being underlined; there is nothing to add.
    message: '',
    suggestions: [...suggestions],
  };
}
