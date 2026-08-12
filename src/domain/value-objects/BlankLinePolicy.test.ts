// ABOUTME: Tests the rule deciding whether a project's blank lines occupy space in the book.
// ABOUTME: Guards the promise that manuscripts predating the feature keep their layout untouched.

import { describe, expect, it } from 'vitest';
import { BLANK_LINES_HONORED_FROM, honorsBlankLines } from './BlankLinePolicy';

const dayBefore = new Date(BLANK_LINES_HONORED_FROM.getTime() - 24 * 60 * 60 * 1000);
const dayAfter = new Date(BLANK_LINES_HONORED_FROM.getTime() + 24 * 60 * 60 * 1000);

describe('honorsBlankLines', () => {
  describe('without an explicit choice, the project creation date decides', () => {
    it('leaves a project predating the feature with its original layout', () => {
      expect(honorsBlankLines(undefined, dayBefore)).toBe(false);
    });

    it('honors blank lines for a project created after the feature shipped', () => {
      expect(honorsBlankLines(undefined, dayAfter)).toBe(true);
    });

    it('treats a project created at the very cutover instant as new', () => {
      expect(honorsBlankLines(undefined, new Date(BLANK_LINES_HONORED_FROM.getTime()))).toBe(true);
    });
  });

  // The author's own choice is the whole point of the setting: it must beat the date on both
  // sides, so an existing manuscript can opt in and a new one can opt out.
  describe('an explicit choice always wins over the date', () => {
    it('honors blank lines in an old project whose author turned the setting on', () => {
      expect(honorsBlankLines(true, dayBefore)).toBe(true);
    });

    it('keeps blank lines invisible in a new project whose author turned the setting off', () => {
      expect(honorsBlankLines(false, dayAfter)).toBe(false);
    });
  });

  // Every project has a creation date, but the value crosses a serialization boundary before
  // reaching here. A missing or unparsable date must never silently reflow a published book.
  describe('a missing creation date falls back to the safe side', () => {
    it('leaves the layout untouched when the creation date is absent', () => {
      expect(honorsBlankLines(undefined, undefined)).toBe(false);
    });

    it('leaves the layout untouched when the creation date is unparsable', () => {
      expect(honorsBlankLines(undefined, new Date('nonsense'))).toBe(false);
    });

    it('still respects an explicit choice when the creation date is absent', () => {
      expect(honorsBlankLines(true, undefined)).toBe(true);
    });
  });
});
