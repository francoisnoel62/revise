// ABOUTME: Tests for the AutocompleteEvent entity
// ABOUTME: Covers validation rules and the create/reconstruct factories

import { describe, it, expect } from 'vitest';
import {
  AutocompleteEvent,
  type CreateAutocompleteEventProps,
} from '../AutocompleteEvent';

function baseProps(
  overrides: Partial<CreateAutocompleteEventProps> = {}
): CreateAutocompleteEventProps {
  return {
    id: '507f1f77bcf86cd799439011',
    ownerId: 'owner-1',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    suggestionId: 'sugg-1',
    providerType: 'anthropic',
    model: 'claude-sonnet-4-5',
    triggeredAt: new Date('2026-06-14T21:00:00Z'),
    firstTokenMs: 220,
    totalMs: 900,
    suggestionLengthChars: 42,
    suggestionLengthWords: 8,
    acceptedChars: 42,
    acceptedWords: 8,
    intent: 'natural',
    outcome: 'accepted_full',
    deletedAfterMs: null,
    canonFactsCount: null,
    ...overrides,
  };
}

describe('AutocompleteEvent', () => {
  it('creates a valid event and sets createdAt', () => {
    const event = AutocompleteEvent.create(baseProps());
    expect(event.getSuggestionId()).toBe('sugg-1');
    expect(event.getOutcome()).toBe('accepted_full');
    expect(event.getFirstTokenMs()).toBe(220);
    expect(event.getCreatedAt()).toBeInstanceOf(Date);
  });

  it('accepts null chapterId / provider / model / firstTokenMs / deletedAfterMs', () => {
    const event = AutocompleteEvent.create(
      baseProps({
        chapterId: null,
        providerType: null,
        model: null,
        outcome: 'empty',
        firstTokenMs: null,
        suggestionLengthChars: 0,
        suggestionLengthWords: 0,
        deletedAfterMs: null,
      })
    );
    expect(event.getChapterId()).toBeNull();
    expect(event.getFirstTokenMs()).toBeNull();
    expect(event.getOutcome()).toBe('empty');
  });

  it('rejects an empty suggestionId', () => {
    expect(() => AutocompleteEvent.create(baseProps({ suggestionId: '  ' }))).toThrow(
      /suggestionId/
    );
  });

  it('rejects an invalid outcome', () => {
    expect(() =>
      AutocompleteEvent.create(baseProps({ outcome: 'nope' as never }))
    ).toThrow(/Invalid outcome/);
  });

  it('supports a partial-acceptance outcome with accepted length', () => {
    const event = AutocompleteEvent.create(
      baseProps({ outcome: 'accepted_partial', acceptedChars: 10, acceptedWords: 2 })
    );
    expect(event.getOutcome()).toBe('accepted_partial');
    expect(event.getAcceptedChars()).toBe(10);
    expect(event.getAcceptedWords()).toBe(2);
  });

  it('rejects negative durations and lengths', () => {
    expect(() => AutocompleteEvent.create(baseProps({ totalMs: -1 }))).toThrow(/totalMs/);
    expect(() => AutocompleteEvent.create(baseProps({ acceptedChars: -1 }))).toThrow(/acceptedChars/);
    expect(() => AutocompleteEvent.create(baseProps({ firstTokenMs: -5 }))).toThrow(
      /firstTokenMs/
    );
    expect(() =>
      AutocompleteEvent.create(baseProps({ suggestionLengthChars: -2 }))
    ).toThrow(/suggestionLengthChars/);
    expect(() => AutocompleteEvent.create(baseProps({ deletedAfterMs: -3 }))).toThrow(
      /deletedAfterMs/
    );
  });

  it('forbids a non-null firstTokenMs when outcome is empty', () => {
    expect(() =>
      AutocompleteEvent.create(baseProps({ outcome: 'empty', firstTokenMs: 100 }))
    ).toThrow(/empty/);
  });

  it('round-trips via reconstruct', () => {
    const created = AutocompleteEvent.create(baseProps());
    const restored = AutocompleteEvent.reconstruct({
      ...baseProps(),
      createdAt: created.getCreatedAt(),
    });
    expect(restored.getId()).toBe(created.getId());
    expect(restored.getTotalMs()).toBe(created.getTotalMs());
    expect(restored.getCreatedAt()).toEqual(created.getCreatedAt());
  });
});
