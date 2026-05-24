// ABOUTME: Tests for text-based matching utility functions
// ABOUTME: Verifies text search and replacement logic

import { describe, it, expect } from 'vitest';
import {
  findTextInContent,
  applyTextReplacement,
  isIssueStillValid,
} from './text-matching';

describe('findTextInContent', () => {
  it('should find unique text occurrence', () => {
    const content = 'The quick brown fox jumps over the lazy dog.';
    const result = findTextInContent(content, 'quick');

    expect(result.found).toBe(true);
    expect(result.index).toBe(4);
    expect(result.matchedText).toBe('quick');
  });

  it('should return not found for missing text', () => {
    const content = 'The quick brown fox.';
    const result = findTextInContent(content, 'cat');

    expect(result.found).toBe(false);
    expect(result.index).toBe(-1);
  });

  it('should handle empty content', () => {
    const result = findTextInContent('', 'test');

    expect(result.found).toBe(false);
    expect(result.index).toBe(-1);
  });

  it('should handle empty search text', () => {
    const result = findTextInContent('content', '');

    expect(result.found).toBe(false);
    expect(result.index).toBe(-1);
  });

  it('should return first occurrence when text appears multiple times without context', () => {
    const content = 'The cat sat on the mat. The cat was happy.';
    const result = findTextInContent(content, 'cat');

    expect(result.found).toBe(true);
    expect(result.index).toBe(4); // First occurrence
  });

  it('should use context to disambiguate multiple occurrences', () => {
    const content = 'The cat sat on the mat. The cat was happy.';
    const result = findTextInContent(content, 'cat', 'The cat was happy.');

    expect(result.found).toBe(true);
    expect(result.index).toBe(28); // Second occurrence (within context)
  });

  it('should fallback to first occurrence if context not found', () => {
    const content = 'The cat sat on the mat. The cat was happy.';
    const result = findTextInContent(content, 'cat', 'The dog was sad.');

    expect(result.found).toBe(true);
    expect(result.index).toBe(4); // First occurrence
  });

  it('should handle context that does not contain the search text', () => {
    const content = 'The cat sat on the mat. The cat was happy.';
    const result = findTextInContent(content, 'cat', 'on the mat');

    expect(result.found).toBe(true);
    expect(result.index).toBe(4); // Fallback to first
  });

  it('should find text at the beginning', () => {
    const content = 'Hello world';
    const result = findTextInContent(content, 'Hello');

    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  it('should find text at the end', () => {
    const content = 'Hello world';
    const result = findTextInContent(content, 'world');

    expect(result.found).toBe(true);
    expect(result.index).toBe(6);
  });

  it('should handle French text with accents', () => {
    const content = "L'été était chaud. L'été prochain sera différent.";
    const result = findTextInContent(content, "L'été", "L'été prochain sera différent.");

    expect(result.found).toBe(true);
    expect(result.index).toBe(19);
  });
});

describe('applyTextReplacement', () => {
  it('should replace text at given index', () => {
    const content = 'The quik brown fox.';
    const result = applyTextReplacement(content, 4, 'quik', 'quick');

    expect(result).toBe('The quick brown fox.');
  });

  it('should handle replacement at beginning', () => {
    const content = 'Teh cat sat.';
    const result = applyTextReplacement(content, 0, 'Teh', 'The');

    expect(result).toBe('The cat sat.');
  });

  it('should handle replacement at end', () => {
    const content = 'The cat satt.';
    const result = applyTextReplacement(content, 8, 'satt', 'sat');

    expect(result).toBe('The cat sat.');
  });

  it('should handle replacement with longer text', () => {
    const content = 'He go to school.';
    const result = applyTextReplacement(content, 3, 'go', 'goes');

    expect(result).toBe('He goes to school.');
  });

  it('should handle replacement with shorter text', () => {
    const content = 'The very very fast car.';
    const result = applyTextReplacement(content, 4, 'very very', 'extremely');

    expect(result).toBe('The extremely fast car.');
  });
});

describe('isIssueStillValid', () => {
  it('should return true if text still exists in content', () => {
    const content = 'The cat sat on the mat.';
    const result = isIssueStillValid(content, 'cat');

    expect(result).toBe(true);
  });

  it('should return false if text no longer exists', () => {
    const content = 'The dog sat on the mat.';
    const result = isIssueStillValid(content, 'cat');

    expect(result).toBe(false);
  });

  it('should use context for disambiguation', () => {
    const content = 'The cat sat. The cat ran.';
    const result = isIssueStillValid(content, 'cat', 'The cat ran.');

    expect(result).toBe(true);
  });
});
