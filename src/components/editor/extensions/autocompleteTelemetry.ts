// ABOUTME: Pure, framework-agnostic lifecycle tracker for autocomplete instrumentation
// ABOUTME: Produces telemetry payloads (no network, no TipTap) so it is unit-testable

import type { AutocompleteOutcome } from '@/domain/value-objects/AutocompleteOutcome';
import type { AutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';

export interface LifecyclePayload {
  type: 'lifecycle';
  suggestionId: string;
  projectId: string;
  chapterId: string | null;
  triggeredAtIso: string;
  firstTokenMs: number | null;
  totalMs: number;
  lengthChars: number;
  lengthWords: number;
  acceptedChars: number;
  acceptedWords: number;
  intent: AutocompleteIntent;
  outcome: AutocompleteOutcome;
}

export interface DeletionPayload {
  type: 'deletion';
  suggestionId: string;
  deletedAfterMs: number;
}

export interface StartContext {
  projectId?: string;
  chapterId: string | null;
  intent: AutocompleteIntent;
}

interface ActiveState {
  suggestionId: string;
  projectId: string;
  chapterId: string | null;
  intent: AutocompleteIntent;
  t0: number;
  triggeredAtIso: string;
  firstTokenMs: number | null;
  lengthChars: number;
  lengthWords: number;
  acceptedChars: number;
  acceptedWords: number;
  partialAccepted: boolean;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Holds the in-progress state of a single suggestion and emits one terminal
 * payload per suggestion. Telemetry is skipped (returns null) when no projectId
 * is available, since the server cannot attribute the event.
 */
export class AutocompleteLifecycleTracker {
  private active: ActiveState | null = null;
  private readonly now: () => number;
  private readonly genId: () => string;

  constructor(deps: { now?: () => number; genId?: () => string } = {}) {
    this.now = deps.now ?? (() => Date.now());
    this.genId =
      deps.genId ??
      (() =>
        typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }

  /** Begin a new suggestion lifecycle. Returns the suggestionId, or null if not trackable. */
  start(ctx: StartContext): string | null {
    if (!ctx.projectId) {
      this.active = null;
      return null;
    }
    const suggestionId = this.genId();
    const t0 = this.now();
    this.active = {
      suggestionId,
      projectId: ctx.projectId,
      chapterId: ctx.chapterId,
      intent: ctx.intent,
      t0,
      triggeredAtIso: new Date(t0).toISOString(),
      firstTokenMs: null,
      lengthChars: 0,
      lengthWords: 0,
      acceptedChars: 0,
      acceptedWords: 0,
      partialAccepted: false,
    };
    return suggestionId;
  }

  /** Record perceived latency on the first streamed token (idempotent). */
  markFirstToken(): void {
    if (this.active && this.active.firstTokenMs === null) {
      this.active.firstTokenMs = this.now() - this.active.t0;
    }
  }

  /** Record the displayed suggestion length (non-terminal). */
  markShown(text: string): void {
    if (this.active) {
      this.active.lengthChars = text.length;
      this.active.lengthWords = countWords(text);
    }
  }

  /** Accumulate a partially-accepted slice (word or fragment); non-terminal. */
  recordPartialAccept(takenText: string): void {
    if (this.active) {
      this.active.acceptedChars += takenText.length;
      this.active.acceptedWords += countWords(takenText);
      this.active.partialAccepted = true;
    }
  }

  hasActive(): boolean {
    return this.active !== null;
  }

  finishEmpty(): LifecyclePayload | null {
    if (!this.active) return null;
    const payload = this.build('empty');
    this.active = null;
    return payload;
  }

  /** The whole (remaining) suggestion was inserted → full acceptance. */
  accept(): LifecyclePayload | null {
    return this.terminate('accepted_full');
  }

  /** Escape: partial if some slices were kept, otherwise an outright rejection. */
  reject(): LifecyclePayload | null {
    if (!this.active) return null;
    return this.terminate(this.active.partialAccepted ? 'accepted_partial' : 'rejected_escape');
  }

  /** Typing instead of accepting: partial if some slices were kept, else superseded. */
  supersede(): LifecyclePayload | null {
    if (!this.active) return null;
    return this.terminate(this.active.partialAccepted ? 'accepted_partial' : 'superseded_typing');
  }

  private terminate(outcome: AutocompleteOutcome): LifecyclePayload | null {
    if (!this.active) return null;
    const payload = this.build(outcome);
    this.active = null;
    return payload;
  }

  private build(outcome: AutocompleteOutcome): LifecyclePayload {
    const a = this.active!;
    let acceptedChars = 0;
    let acceptedWords = 0;
    if (outcome === 'accepted_full') {
      acceptedChars = a.lengthChars;
      acceptedWords = a.lengthWords;
    } else if (outcome === 'accepted_partial') {
      acceptedChars = a.acceptedChars;
      acceptedWords = a.acceptedWords;
    }
    return {
      type: 'lifecycle',
      suggestionId: a.suggestionId,
      projectId: a.projectId,
      chapterId: a.chapterId,
      triggeredAtIso: a.triggeredAtIso,
      firstTokenMs: outcome === 'empty' ? null : a.firstTokenMs,
      totalMs: this.now() - a.t0,
      lengthChars: outcome === 'empty' ? 0 : a.lengthChars,
      lengthWords: outcome === 'empty' ? 0 : a.lengthWords,
      acceptedChars,
      acceptedWords,
      intent: a.intent,
      outcome,
    };
  }
}
