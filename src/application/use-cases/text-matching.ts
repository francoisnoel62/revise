// ABOUTME: Utility functions for text-based matching in corrections
// ABOUTME: Replaces fragile position-based matching with robust text search

export interface TextMatchResult {
  found: boolean;
  index: number;
  matchedText: string;
}

/**
 * Find text in content using the original text and optional context for disambiguation.
 *
 * Strategy:
 * 1. If text appears exactly once -> return its position
 * 2. If text appears multiple times and context is provided -> find via context
 * 3. If text appears multiple times without context -> return first occurrence
 * 4. If text not found -> return not found
 *
 * @param content The full text content to search in
 * @param originalText The exact text to find
 * @param context Optional surrounding context to help disambiguate multiple occurrences
 * @returns TextMatchResult with found status and index
 */
export function findTextInContent(
  content: string,
  originalText: string,
  context?: string
): TextMatchResult {
  if (!content || !originalText) {
    return { found: false, index: -1, matchedText: '' };
  }

  const firstIndex = content.indexOf(originalText);

  // Text not found at all
  if (firstIndex === -1) {
    return { found: false, index: -1, matchedText: '' };
  }

  const lastIndex = content.lastIndexOf(originalText);

  // Unique occurrence - simple case
  if (firstIndex === lastIndex) {
    return { found: true, index: firstIndex, matchedText: originalText };
  }

  // Multiple occurrences - try to use context to disambiguate
  if (context && context.length > 0) {
    const contextIndex = content.indexOf(context);
    if (contextIndex !== -1) {
      // Find the text within the context
      const localIndex = context.indexOf(originalText);
      if (localIndex !== -1) {
        const absoluteIndex = contextIndex + localIndex;
        // Verify the text is actually at this position
        if (content.substring(absoluteIndex, absoluteIndex + originalText.length) === originalText) {
          return { found: true, index: absoluteIndex, matchedText: originalText };
        }
      }
    }
  }

  // Fallback: return first occurrence
  return { found: true, index: firstIndex, matchedText: originalText };
}

/**
 * Apply a text replacement at a specific index.
 *
 * @param content The original content
 * @param index The starting index of the text to replace
 * @param originalText The text to replace (used to determine length)
 * @param replacement The new text to insert
 * @returns The updated content
 */
export function applyTextReplacement(
  content: string,
  index: number,
  originalText: string,
  replacement: string
): string {
  return (
    content.substring(0, index) +
    replacement +
    content.substring(index + originalText.length)
  );
}

/**
 * Check if applying a correction would overlap with another issue's text.
 * Used to invalidate issues after a correction is applied.
 *
 * @param correctionIndex Index where correction was applied
 * @param correctionOriginalText Original text that was replaced
 * @param issueOriginalText Text of another issue to check
 * @param content The content after correction
 * @returns true if the issue is still valid (text still exists)
 */
export function isIssueStillValid(
  content: string,
  issueOriginalText: string,
  issueContext?: string
): boolean {
  const result = findTextInContent(content, issueOriginalText, issueContext);
  return result.found;
}
