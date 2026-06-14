// ABOUTME: Pure, framework-agnostic lifecycle tracker for autocomplete instrumentation
// ABOUTME: Produces telemetry payloads (no network, no TipTap) so it is unit-testable

import type { AutocompleteOutcome } from '@/domain/value-objects/AutocompleteOutcome';

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
}

interface ActiveState {
  suggestionId: string;
  projectId: string;
  chapterId: string | null;
  t0: number;
  triggeredAtIso: string;
  firstTokenMs: number | null;
  lengthChars: number;
  lengthWords: number;
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
      t0,
      triggeredAtIso: new Date(t0).toISOString(),
      firstTokenMs: null,
      lengthChars: 0,
      lengthWords: 0,
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

  hasActive(): boolean {
    return this.active !== null;
  }

  finishEmpty(): LifecyclePayload | null {
    if (!this.active) return null;
    const payload = this.build('empty', { forceEmpty: true });
    this.active = null;
    return payload;
  }

  accept(): LifecyclePayload | null {
    return this.terminate('accepted_full');
  }

  reject(): LifecyclePayload | null {
    return this.terminate('rejected_escape');
  }

  supersede(): LifecyclePayload | null {
    return this.terminate('superseded_typing');
  }

  private terminate(outcome: AutocompleteOutcome): LifecyclePayload | null {
    if (!this.active) return null;
    const payload = this.build(outcome, { forceEmpty: false });
    this.active = null;
    return payload;
  }

  private build(
    outcome: AutocompleteOutcome,
    opts: { forceEmpty: boolean }
  ): LifecyclePayload {
    const a = this.active!;
    return {
      type: 'lifecycle',
      suggestionId: a.suggestionId,
      projectId: a.projectId,
      chapterId: a.chapterId,
      triggeredAtIso: a.triggeredAtIso,
      firstTokenMs: opts.forceEmpty ? null : a.firstTokenMs,
      totalMs: this.now() - a.t0,
      lengthChars: opts.forceEmpty ? 0 : a.lengthChars,
      lengthWords: opts.forceEmpty ? 0 : a.lengthWords,
      outcome,
    };
  }
}
