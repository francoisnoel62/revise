// ABOUTME: Tests for the pure AutocompleteLifecycleTracker
// ABOUTME: Verifies timings, lengths and terminal outcomes with an injected clock

import { describe, it, expect } from 'vitest';
import { AutocompleteLifecycleTracker } from '../autocompleteTelemetry';

function makeClock(times: number[]): () => number {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)];
}

const ctx = { projectId: 'proj-1', chapterId: 'chap-1', intent: 'natural' as const };

describe('AutocompleteLifecycleTracker', () => {
  it('produces an accepted_full payload with latency, duration and length', () => {
    // now() called: start(t0=0), markFirstToken(200), accept(900)
    const tracker = new AutocompleteLifecycleTracker({
      now: makeClock([0, 200, 900]),
      genId: () => 'sugg-1',
    });

    const id = tracker.start({ ...ctx, intent: 'tenser' });
    tracker.markFirstToken();
    tracker.markShown('bonjour le monde');
    const payload = tracker.accept();

    expect(id).toBe('sugg-1');
    expect(payload).not.toBeNull();
    expect(payload!.intent).toBe('tenser');
    expect(payload!.outcome).toBe('accepted_full');
    expect(payload!.firstTokenMs).toBe(200);
    expect(payload!.totalMs).toBe(900);
    expect(payload!.lengthChars).toBe('bonjour le monde'.length);
    expect(payload!.lengthWords).toBe(3);
    expect(payload!.suggestionId).toBe('sugg-1');
    expect(payload!.projectId).toBe('proj-1');
  });

  it('attaches provider metadata when the stream reports it', () => {
    const tracker = new AutocompleteLifecycleTracker({
      now: makeClock([0, 100, 500]),
      genId: () => 'sugg-provider',
    });

    tracker.start(ctx);
    tracker.setProviderMetadata('anthropic', 'claude-sonnet-4-5');
    tracker.markFirstToken();
    tracker.markShown('suite');
    const payload = tracker.accept();

    expect(payload!.providerType).toBe('anthropic');
    expect(payload!.model).toBe('claude-sonnet-4-5');
  });

  it('produces an empty payload with null latency and zero length', () => {
    const tracker = new AutocompleteLifecycleTracker({
      now: makeClock([0, 400]),
      genId: () => 'sugg-2',
    });
    tracker.start(ctx);
    const payload = tracker.finishEmpty();

    expect(payload!.outcome).toBe('empty');
    expect(payload!.firstTokenMs).toBeNull();
    expect(payload!.lengthChars).toBe(0);
    expect(payload!.lengthWords).toBe(0);
    expect(payload!.totalMs).toBe(400);
  });

  it('produces rejected_escape and superseded_typing outcomes', () => {
    const reject = new AutocompleteLifecycleTracker({ now: makeClock([0, 100]), genId: () => 'r' });
    reject.start(ctx);
    expect(reject.reject()!.outcome).toBe('rejected_escape');

    const supersede = new AutocompleteLifecycleTracker({ now: makeClock([0, 100]), genId: () => 's' });
    supersede.start(ctx);
    expect(supersede.supersede()!.outcome).toBe('superseded_typing');
  });

  it('reports accepted length on a full acceptance', () => {
    const tracker = new AutocompleteLifecycleTracker({ now: makeClock([0, 50, 900]), genId: () => 'f' });
    tracker.start(ctx);
    tracker.markShown('bonjour le monde');
    const payload = tracker.accept()!;
    expect(payload.outcome).toBe('accepted_full');
    expect(payload.acceptedChars).toBe('bonjour le monde'.length);
    expect(payload.acceptedWords).toBe(3);
  });

  it('becomes accepted_partial (with accepted length) when some is kept then rejected', () => {
    const tracker = new AutocompleteLifecycleTracker({ now: makeClock([0, 50, 200, 900]), genId: () => 'p' });
    tracker.start(ctx);
    tracker.markShown('bonjour le monde');
    tracker.recordPartialAccept('bonjour ');
    const payload = tracker.reject()!;
    expect(payload.outcome).toBe('accepted_partial');
    expect(payload.acceptedChars).toBe('bonjour '.length);
    expect(payload.acceptedWords).toBe(1);
  });

  it('becomes accepted_partial when some is kept then superseded by typing', () => {
    const tracker = new AutocompleteLifecycleTracker({ now: makeClock([0, 50, 200, 900]), genId: () => 'p2' });
    tracker.start(ctx);
    tracker.markShown('bonjour le monde');
    tracker.recordPartialAccept('bonjour ');
    expect(tracker.supersede()!.outcome).toBe('accepted_partial');
  });

  it('returns null and stays idle when there is no projectId', () => {
    const tracker = new AutocompleteLifecycleTracker({ genId: () => 'x' });
    const id = tracker.start({ projectId: undefined, chapterId: null, intent: 'natural' });
    expect(id).toBeNull();
    expect(tracker.hasActive()).toBe(false);
    expect(tracker.accept()).toBeNull();
  });

  it('returns null on terminal calls without an active suggestion', () => {
    const tracker = new AutocompleteLifecycleTracker({ genId: () => 'x' });
    expect(tracker.accept()).toBeNull();
    expect(tracker.reject()).toBeNull();
    expect(tracker.finishEmpty()).toBeNull();
  });

  it('clears the active suggestion after a terminal outcome (no double count)', () => {
    const tracker = new AutocompleteLifecycleTracker({ now: makeClock([0, 50, 60]), genId: () => 'one' });
    tracker.start(ctx);
    expect(tracker.accept()).not.toBeNull();
    expect(tracker.accept()).toBeNull();
    expect(tracker.hasActive()).toBe(false);
  });
});
