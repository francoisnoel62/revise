// ABOUTME: Unit tests for the Autocomplete extension's pure prefetch helpers
// ABOUTME: Covers the sentence-boundary gate, the trigger predicate, discarded-prefetch accounting, and before-text clamping

import { describe, it, expect, vi } from 'vitest';
import {
  endsWithSentenceBoundary,
  shouldTriggerSmartPrefetch,
  flushDiscardedPrefetch,
  clampBeforeText,
  MAX_BEFORE_CHARS,
  type AutocompleteOptions,
  type AutocompleteStorage,
} from './Autocomplete';
import type { PrefetchTelemetryRecord } from './autocompleteTelemetry';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

describe('endsWithSentenceBoundary', () => {
  it('matches a period at the end', () => {
    expect(endsWithSentenceBoundary('Hello world.')).toBe(true);
  });

  it('matches an exclamation mark', () => {
    expect(endsWithSentenceBoundary('Wow!')).toBe(true);
  });

  it('matches a question mark', () => {
    expect(endsWithSentenceBoundary('Really?')).toBe(true);
  });

  it('matches an ellipsis character', () => {
    expect(endsWithSentenceBoundary('And then…')).toBe(true);
  });

  it('matches with trailing whitespace after boundary', () => {
    expect(endsWithSentenceBoundary('End. ')).toBe(true);
  });

  it('does not match a comma', () => {
    expect(endsWithSentenceBoundary('Hello,')).toBe(false);
  });

  it('does not match a plain word ending', () => {
    expect(endsWithSentenceBoundary('Hello world')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(endsWithSentenceBoundary('')).toBe(false);
  });

  it('does not match a colon', () => {
    expect(endsWithSentenceBoundary('Note:')).toBe(false);
  });
});

describe('shouldTriggerSmartPrefetch', () => {
  const longSentence = 'Elle regarda la porte longtemps, sans oser avancer';

  it('fires at a completed sentence with enough context', () => {
    expect(shouldTriggerSmartPrefetch(`${longSentence}. `)).toBe(true);
  });

  it('does not fire on a pause mid-clause (no sentence boundary)', () => {
    expect(shouldTriggerSmartPrefetch(`${longSentence} `)).toBe(false);
  });

  it('does not fire right after a word with no boundary', () => {
    expect(shouldTriggerSmartPrefetch(longSentence)).toBe(false);
  });

  it('rejects too-short context even after a boundary', () => {
    expect(shouldTriggerSmartPrefetch('Trop court. ')).toBe(false);
  });

  it('does not fire when the cursor is in the middle of a word', () => {
    expect(
      shouldTriggerSmartPrefetch(
        'Elle regarda la porte longtemps, sans oser avan',
        'cer.'
      )
    ).toBe(false);
  });
});

describe('flushDiscardedPrefetch', () => {
  const readyRecord = (): PrefetchTelemetryRecord => ({
    suggestionId: 'pf-1',
    projectId: 'proj-1',
    chapterId: 'chap-1',
    intent: 'natural',
    triggeredAtIso: '2026-06-16T10:00:00.000Z',
    startedAtMs: 1000,
    firstTokenMs: 200,
    lengthChars: 12,
    lengthWords: 2,
    providerType: 'anthropic',
    model: 'claude-sonnet-4-5',
    canonFactsCount: 0,
  });

  function makeStorage(record: PrefetchTelemetryRecord | null) {
    const onEvent = vi.fn();
    const storage = { prefetchTelemetry: record, onEvent } as unknown as AutocompleteStorage;
    return { storage, onEvent };
  }

  const options = { telemetryEnabled: true } as unknown as AutocompleteOptions;

  it('emits a prefetch_discarded event for a ready prefetch and clears it', () => {
    const { storage, onEvent } = makeStorage(readyRecord());

    flushDiscardedPrefetch(options, storage);

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent.mock.calls[0][0]).toMatchObject({
      type: 'lifecycle',
      outcome: 'prefetch_discarded',
      triggerSource: 'prefetch',
      suggestionId: 'pf-1',
    });
    expect(storage.prefetchTelemetry).toBeNull();
  });

  it('does not emit for an in-flight prefetch (nothing generated yet) but still clears', () => {
    const { storage, onEvent } = makeStorage({ ...readyRecord(), lengthChars: 0, lengthWords: 0 });

    flushDiscardedPrefetch(options, storage);

    expect(onEvent).not.toHaveBeenCalled();
    expect(storage.prefetchTelemetry).toBeNull();
  });

  it('does not emit when telemetry is disabled', () => {
    const { storage, onEvent } = makeStorage(readyRecord());
    const disabled = { telemetryEnabled: false } as unknown as AutocompleteOptions;

    flushDiscardedPrefetch(disabled, storage);

    expect(onEvent).not.toHaveBeenCalled();
    expect(storage.prefetchTelemetry).toBeNull();
  });

  it('is a no-op when there is no prefetch record', () => {
    const { storage, onEvent } = makeStorage(null);

    flushDiscardedPrefetch(options, storage);

    expect(onEvent).not.toHaveBeenCalled();
    expect(storage.prefetchTelemetry).toBeNull();
  });
});

describe('clampBeforeText', () => {
  it('returns the text unchanged when it is shorter than MAX_BEFORE_CHARS', () => {
    const short = 'a'.repeat(100);
    expect(clampBeforeText(short)).toBe(short);
  });

  it('returns the text unchanged when it equals MAX_BEFORE_CHARS exactly', () => {
    const exact = 'x'.repeat(MAX_BEFORE_CHARS);
    expect(clampBeforeText(exact)).toBe(exact);
  });

  it('truncates from the left when text exceeds MAX_BEFORE_CHARS, preserving the end', () => {
    const prefix = 'a'.repeat(500);
    const suffix = 'b'.repeat(MAX_BEFORE_CHARS);
    const long = prefix + suffix;
    const result = clampBeforeText(long);
    expect(result).toHaveLength(MAX_BEFORE_CHARS);
    expect(result).toBe(suffix);
  });

  it('returns an empty string for empty input', () => {
    expect(clampBeforeText('')).toBe('');
  });

  it('MAX_BEFORE_CHARS equals the server limit of 8000', () => {
    expect(MAX_BEFORE_CHARS).toBe(8000);
  });
});

/**
 * #108 — Invariant: TipTap document contains a single chapter at a time.
 * Therefore doc.textBetween(0, cursorPos) always starts from the chapter beginning.
 * This test documents the contract so a regression (adding multi-chapter content
 * to a single editor) would break it explicitly.
 */
describe('chapter-start extraction invariant (#108)', () => {
  it('doc.textBetween(0, pos) includes text from the very beginning of the document', () => {
    const openingLine = 'Il faisait nuit noire.';
    const laterLine = 'Elle entendit un bruit.';
    const editor = new Editor({
      extensions: [Document, Paragraph, Text],
      content: `<p>${openingLine}</p><p>${laterLine}</p>`,
    });

    // Position cursor at the end of the second paragraph
    const docSize = editor.state.doc.content.size;
    const cursorPos = docSize - 1;

    const extracted = editor.state.doc.textBetween(0, cursorPos, '\n', '\n');

    // The extraction starts from position 0 — it must include the chapter's opening line
    expect(extracted).toContain(openingLine);
    expect(extracted).toContain(laterLine);

    editor.destroy();
  });

  it('clampBeforeText preserves the end of the text (closest to cursor), not the start', () => {
    // This is intentional: when the chapter is longer than MAX_BEFORE_CHARS,
    // we keep the most recent context. The chapter beginning is covered by canon facts.
    const chapterStart = 'START '.repeat(100);
    const recentContext = 'RECENT '.repeat(MAX_BEFORE_CHARS / 7 + 1);
    const full = chapterStart + recentContext;

    const clamped = clampBeforeText(full);

    expect(clamped).toHaveLength(MAX_BEFORE_CHARS);
    expect(clamped.endsWith(recentContext.slice(-50))).toBe(true);
    expect(clamped.startsWith('START')).toBe(false);
  });
});
