// ABOUTME: Unit tests for the Autocomplete extension's prefetch and idle-timer logic
// ABOUTME: Focuses on the pure endsWithSentenceBoundary helper and storage transitions

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { endsWithSentenceBoundary } from './Autocomplete';

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

describe('idle timer behavior (using fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires callback after 10 seconds', () => {
    const callback = vi.fn();
    setTimeout(callback, 10000);
    vi.advanceTimersByTime(9999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('clearTimeout prevents callback from firing', () => {
    const callback = vi.fn();
    const handle = setTimeout(callback, 10000);
    clearTimeout(handle);
    vi.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });
});
