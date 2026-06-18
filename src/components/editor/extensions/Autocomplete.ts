// ABOUTME: TipTap extension for AI-powered text autocompletion
// ABOUTME: Silent prefetch on idle → breathing dot → ghost text on Tab → accept

import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  AutocompleteLifecycleTracker,
  buildPrefetchDiscardedPayload,
  type LifecyclePayload,
  type DeletionPayload,
  type PrefetchTelemetryRecord,
} from './autocompleteTelemetry';
import { nextWord, nextFragment } from './suggestionSegments';
import {
  type AutocompleteIntent,
  AUTOCOMPLETE_INTENTS,
  autocompleteIntentByNumber,
  nextAutocompleteIntent,
} from '@/domain/value-objects/AutocompleteIntent';
import {
  autocompleteShortcutHints,
  autocompleteVariantHints,
  shouldShowAutocompleteVariantHint,
} from './autocompleteHint';
import type { SuggestionLength, AudaceLevel } from '@/domain/value-objects/AutocompletePreferences';

export type AutocompleteRunState =
  | 'idle'
  | 'waiting'
  | 'prefetching'
  | 'ready'
  | 'visible'
  | 'accepting'
  | 'rejected';

export interface AutocompleteOptions {
  onComplete: (
    textBeforeCursor: string,
    textAfterCursor: string
  ) => Promise<string | null>;
  projectId?: string;
  chapterId?: string;
  useStreaming: boolean;
  enabled: boolean;
  telemetryEnabled?: boolean;
  onEvent?: (payload: LifecyclePayload | DeletionPayload) => void;
  suggestionLength?: SuggestionLength;
  audace?: AudaceLevel;
  partialAcceptance?: boolean;
  smartPrefetch?: boolean;
}

export interface AutocompleteStorage {
  suggestion: string | null;
  isLoading: boolean;
  isPrefetching: boolean;
  runState: AutocompleteRunState;
  abortController: AbortController | null;
  enabled: boolean;
  projectId?: string;
  chapterId?: string;
  suggestionLength?: SuggestionLength;
  audace?: AudaceLevel;
  partialAcceptance: boolean;
  smartPrefetch: boolean;
  onEvent?: (payload: LifecyclePayload | DeletionPayload) => void;
  tracker: AutocompleteLifecycleTracker;
  acceptingInsertion: boolean;
  currentIntent: AutocompleteIntent;
  prefetchedSuggestion: string | null;
  prefetchAbortController: AbortController | null;
  prefetchTelemetry: PrefetchTelemetryRecord | null;
  idleTimerHandle: ReturnType<typeof globalThis.setTimeout> | null;
  rejectionHintVisible: boolean;
  rejectionHintTimerHandle: ReturnType<typeof globalThis.setTimeout> | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autocomplete: {
      setAutocompleteEnabled: (enabled: boolean) => ReturnType;
      setAutocompleteChapterId: (chapterId?: string) => ReturnType;
      setAutocompleteRuntimeOptions: (
        options: Partial<Pick<
          AutocompleteStorage,
          | 'enabled'
          | 'projectId'
          | 'chapterId'
          | 'suggestionLength'
          | 'audace'
          | 'partialAcceptance'
          | 'smartPrefetch'
          | 'onEvent'
        >>
      ) => ReturnType;
    };
  }
}

const autocompletePluginKey = new PluginKey('autocomplete');

const DELETION_WATCH_MS = 30000;
const PREFETCH_IDLE_MS = 10000;
export const MAX_BEFORE_CHARS = 8000;

/** Truncates text from the left so it never exceeds MAX_BEFORE_CHARS, preserving the tail closest to the cursor. */
export function clampBeforeText(text: string): string {
  return text.length > MAX_BEFORE_CHARS ? text.slice(-MAX_BEFORE_CHARS) : text;
}

/** Returns true if text ends with a sentence-boundary character. */
export function endsWithSentenceBoundary(text: string): boolean {
  return /[.!?…]\s*$/.test(text.trimEnd());
}

export function shouldTriggerSmartPrefetch(
  textBefore: string,
  textAfter: string = ''
): boolean {
  const trimmedBefore = textBefore.trim();
  if (trimmedBefore.length < 40) return false;
  // Never fire mid-word.
  if (/[\p{L}\p{N}]$/u.test(textBefore) && /^[\p{L}\p{N}]/u.test(textAfter)) {
    return false;
  }
  // Only fire at a natural stop — the author just finished a sentence — instead
  // of on every short pause mid-clause. Most mid-clause prefetches are discarded
  // by the next keystroke, so this cuts wasted (billed) LLM calls.
  if (!endsWithSentenceBoundary(textBefore)) return false;
  return true;
}

function emitEvent(
  options: AutocompleteOptions,
  storage: AutocompleteStorage,
  payload: LifecyclePayload | DeletionPayload | null
): void {
  if (payload && options.telemetryEnabled !== false && storage.onEvent) {
    storage.onEvent(payload);
  }
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function generateSuggestionId(): string {
  return typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * A prefetch that became ready but is now being thrown away (typing, cursor
 * move, Escape, disable) is a billed LLM call the author never used. Report it
 * once as `prefetch_discarded`, then drop the record. In-flight prefetches
 * (lengthChars still 0) are not counted — only fully generated, wasted ones.
 */
export function flushDiscardedPrefetch(
  options: AutocompleteOptions,
  storage: AutocompleteStorage
): void {
  const record = storage.prefetchTelemetry;
  if (record && record.lengthChars > 0) {
    emitEvent(options, storage, buildPrefetchDiscardedPayload(record, Date.now()));
  }
  storage.prefetchTelemetry = null;
}

function createAutocompleteHint(intent: AutocompleteIntent): HTMLElement {
  const hint = document.createElement('span');
  hint.className = 'autocomplete-hint';
  hint.setAttribute('aria-hidden', 'true');

  const shortcutRow = document.createElement('span');
  shortcutRow.className = 'autocomplete-hint-row';

  for (const item of autocompleteShortcutHints()) {
    const shortcut = document.createElement('span');
    shortcut.className = 'autocomplete-hint-item';

    for (const key of item.keys) {
      const keys = document.createElement('span');
      keys.className = 'autocomplete-kbd';
      keys.textContent = key;
      shortcut.append(keys);
    }

    const label = document.createElement('span');
    label.textContent = item.label;

    shortcut.append(label);
    shortcutRow.append(shortcut);
  }

  hint.append(shortcutRow);

  if (shouldShowAutocompleteVariantHint(intent)) {
    const variantRow = document.createElement('span');
    variantRow.className = 'autocomplete-hint-row autocomplete-variant-row';

    for (const item of autocompleteVariantHints(intent)) {
      const variant = document.createElement('span');
      variant.className = item.active
        ? 'autocomplete-variant autocomplete-variant-active'
        : 'autocomplete-variant';

      const number = document.createElement('span');
      number.className = 'autocomplete-variant-number';
      number.textContent = String(item.number);

      const label = document.createElement('span');
      label.textContent = item.label;

      variant.append(number, label);
      variantRow.append(variant);
    }

    hint.append(variantRow);
  }

  return hint;
}

function acceptSegment(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions,
  splitter: (s: string) => { take: string; rest: string }
): boolean {
  if (!storage.enabled || !storage.suggestion || storage.partialAcceptance === false) {
    return false;
  }
  const { take, rest } = splitter(storage.suggestion);
  if (!take) return false;

  storage.acceptingInsertion = true;
  editor.commands.insertContent(take);
  storage.acceptingInsertion = false;

  storage.tracker.recordPartialAccept(take);
  storage.suggestion = rest || null;

  if (!storage.suggestion) {
    emitEvent(options, storage, storage.tracker.accept());
  } else {
    editor.view.dispatch(editor.state.tr);
  }
  return true;
}

function scheduleDeletionWatch(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions,
  suggestionId: string,
  insertedText: string,
  pos: number
): void {
  if (!insertedText) return;
  const acceptedAt = Date.now();
  globalThis.setTimeout(() => {
    if (editor.isDestroyed) return;
    const doc = editor.state.doc;
    const end = Math.min(doc.content.size, pos + insertedText.length);
    const after = doc.textBetween(pos, end, '\n', '\n');
    if (after !== insertedText) {
      emitEvent(options, storage, {
        type: 'deletion',
        suggestionId,
        deletedAfterMs: Date.now() - acceptedAt,
      });
    }
  }, DELETION_WATCH_MS);
}

function buildContext(
  editor: Editor
): { textBefore: string; textAfter: string } {
  const { state } = editor;
  const { selection, doc } = state;
  const pos = selection.from;
  const textBefore = clampBeforeText(doc.textBetween(0, pos, '\n', '\n'));
  const textAfter = doc.textBetween(
    pos,
    Math.min(doc.content.size, pos + 400),
    '\n',
    '\n'
  );
  return { textBefore, textAfter };
}

function triggerCompletion(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions
): void {
  if (storage.isLoading) return;

  const { textBefore, textAfter } = buildContext(editor);
  if (!textBefore.trim()) return;

  storage.prefetchAbortController?.abort();
  storage.prefetchAbortController = null;
  storage.prefetchedSuggestion = null;
  storage.isPrefetching = false;
  storage.isLoading = true;
  storage.runState = 'visible';

  if (options.telemetryEnabled !== false) {
    storage.tracker.start({
      projectId: storage.projectId,
      chapterId: storage.chapterId ?? null,
      intent: storage.currentIntent,
      triggerSource: 'manual',
    });
  }

  editor.view.dispatch(editor.state.tr);

  if (options.useStreaming && storage.projectId) {
    streamCompletion(editor, storage, options, textBefore, textAfter, false);
  } else {
    options
      .onComplete(textBefore, textAfter)
      .then((suggestion) => {
        storage.isLoading = false;
        if (suggestion) {
          storage.suggestion = suggestion;
          storage.runState = 'visible';
          storage.tracker.markFirstToken();
          storage.tracker.markShown(suggestion);
        } else {
          storage.runState = 'idle';
          emitEvent(options, storage, storage.tracker.finishEmpty());
        }
        editor.view.dispatch(editor.state.tr);
      })
      .catch(() => {
        storage.isLoading = false;
        storage.runState = 'idle';
        editor.view.dispatch(editor.state.tr);
      });
  }
}

function triggerPrefetch(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions
): void {
  if (
    !storage.enabled ||
    !storage.smartPrefetch ||
    storage.isLoading ||
    storage.isPrefetching ||
    storage.prefetchedSuggestion ||
    storage.suggestion
  ) return;

  const { textBefore, textAfter } = buildContext(editor);
  if (!textBefore.trim()) return;

  storage.isPrefetching = true;
  storage.runState = 'prefetching';
  storage.prefetchTelemetry =
    options.telemetryEnabled !== false && storage.projectId
      ? {
          suggestionId: generateSuggestionId(),
          projectId: storage.projectId,
          chapterId: storage.chapterId ?? null,
          intent: storage.currentIntent,
          triggeredAtIso: new Date().toISOString(),
          startedAtMs: Date.now(),
          firstTokenMs: null,
          lengthChars: 0,
          lengthWords: 0,
          providerType: null,
          model: null,
          canonFactsCount: null,
        }
      : null;
  editor.view.dispatch(editor.state.tr);

  if (options.useStreaming && storage.projectId) {
    streamCompletion(editor, storage, options, textBefore, textAfter, true);
  } else {
    options
      .onComplete(textBefore, textAfter)
      .then((suggestion) => {
        // The author may have typed/moved while we awaited — that path already
        // aborted and cleared the prefetch, so don't resurrect a stale one.
        if (!storage.isPrefetching) return;
        storage.isPrefetching = false;
        if (suggestion) {
          storage.prefetchedSuggestion = suggestion;
          storage.runState = 'ready';
          if (storage.prefetchTelemetry) {
            storage.prefetchTelemetry.lengthChars = suggestion.length;
            storage.prefetchTelemetry.lengthWords = countWords(suggestion);
          }
        } else {
          storage.runState = 'idle';
          storage.prefetchTelemetry = null;
        }
        editor.view.dispatch(editor.state.tr);
      })
      .catch(() => {
        storage.isPrefetching = false;
        storage.runState = 'idle';
        storage.prefetchTelemetry = null;
        editor.view.dispatch(editor.state.tr);
        // Silent failure — prefetch is best-effort
      });
  }
}

function scheduleSmartPrefetchTimer(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions
): void {
  globalThis.clearTimeout(storage.idleTimerHandle ?? undefined);
  storage.idleTimerHandle = null;

  if (
    !storage.enabled ||
    !storage.smartPrefetch ||
    storage.suggestion ||
    storage.isLoading ||
    storage.isPrefetching
  ) {
    if (!storage.suggestion && !storage.isLoading && !storage.isPrefetching) {
      storage.runState = 'idle';
    }
    return;
  }

  storage.runState = 'waiting';
  storage.idleTimerHandle = globalThis.setTimeout(() => {
    const { state } = editor;
    if (!state.selection.empty) return;
    const pos = state.selection.from;
    const textBefore = state.doc.textBetween(
      Math.max(0, pos - 500),
      pos,
      '\n',
      '\n'
    );
    const textAfter = state.doc.textBetween(
      pos,
      Math.min(state.doc.content.size, pos + 1),
      '\n',
      '\n'
    );
    if (
      shouldTriggerSmartPrefetch(textBefore, textAfter) &&
      !storage.suggestion &&
      storage.enabled &&
      storage.smartPrefetch
    ) {
      triggerPrefetch(editor, storage, options);
    } else if (!storage.suggestion && !storage.prefetchedSuggestion) {
      storage.runState = 'idle';
      editor.view.dispatch(editor.state.tr);
    }
  }, PREFETCH_IDLE_MS);
}

function regenerateWithIntent(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions,
  intent: AutocompleteIntent
): void {
  storage.currentIntent = intent;
  storage.abortController?.abort();
  storage.abortController = null;
  storage.suggestion = null;
  storage.isLoading = false;
  triggerCompletion(editor, storage, options);
}

async function streamCompletion(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions,
  textBefore: string,
  textAfter: string,
  isPrefetch: boolean
): Promise<void> {
  const abortController = new AbortController();
  if (isPrefetch) {
    storage.prefetchAbortController = abortController;
  } else {
    storage.abortController = abortController;
  }

  try {
    const response = await fetch('/api/completion/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: storage.projectId,
        textBeforeCursor: textBefore,
        textAfterCursor: textAfter,
        chapterId: storage.chapterId,
        intent: storage.currentIntent,
        suggestionLength: storage.suggestionLength,
        audace: storage.audace,
        isPrefetch,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) throw new Error('Failed to fetch completion');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);

            if (parsed.type === 'metadata') {
              const providerType =
                typeof parsed.providerType === 'string' ? parsed.providerType : null;
              const model = typeof parsed.model === 'string' ? parsed.model : null;
              const canonFactsCount =
                typeof parsed.canonFactsCount === 'number' ? parsed.canonFactsCount : null;
              if (!isPrefetch) {
                storage.tracker.setProviderMetadata(providerType, model, canonFactsCount);
              } else if (storage.prefetchTelemetry) {
                storage.prefetchTelemetry.providerType = providerType;
                storage.prefetchTelemetry.model = model;
                storage.prefetchTelemetry.canonFactsCount = canonFactsCount;
              }
              continue;
            }

            if (parsed.text) {
              if (!isPrefetch) {
                storage.tracker.markFirstToken();
              } else if (
                storage.prefetchTelemetry &&
                storage.prefetchTelemetry.firstTokenMs === null
              ) {
                storage.prefetchTelemetry.firstTokenMs =
                  Date.now() - storage.prefetchTelemetry.startedAtMs;
              }
              accumulated += parsed.text;
              if (!isPrefetch) {
                storage.suggestion = accumulated;
                editor.view.dispatch(editor.state.tr);
              }
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    if (isPrefetch) {
      storage.isPrefetching = false;
      storage.prefetchAbortController = null;
      const trimmed = accumulated.trim();
      const ready = trimmed.length > 0;
      storage.prefetchedSuggestion = ready ? trimmed : null;
      storage.runState = ready ? 'ready' : 'idle';
      if (ready && storage.prefetchTelemetry) {
        storage.prefetchTelemetry.lengthChars = trimmed.length;
        storage.prefetchTelemetry.lengthWords = countWords(trimmed);
      } else {
        // Empty completion — nothing was generated, so nothing was wasted.
        storage.prefetchTelemetry = null;
      }
    } else {
      storage.isLoading = false;
      storage.abortController = null;
      if (accumulated.trim().length === 0) {
        storage.runState = 'idle';
        emitEvent(options, storage, storage.tracker.finishEmpty());
      } else {
        storage.runState = 'visible';
        storage.tracker.markShown(accumulated);
      }
    }

    editor.view.dispatch(editor.state.tr);
  } catch (error) {
    if (isPrefetch) {
      storage.isPrefetching = false;
      storage.runState = 'idle';
      storage.prefetchAbortController = null;
      // Aborted/failed before it was usable — not counted as wasted spend.
      storage.prefetchTelemetry = null;
      editor.view.dispatch(editor.state.tr);
    } else {
      storage.isLoading = false;
      storage.runState = 'idle';
      storage.abortController = null;
      editor.view.dispatch(editor.state.tr);
    }
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Completion error:', error);
    }
  }
}

export const Autocomplete = Extension.create<AutocompleteOptions, AutocompleteStorage>({
  name: 'autocomplete',

  addOptions() {
    return {
      onComplete: async () => null,
      projectId: undefined,
      chapterId: undefined,
      useStreaming: true,
      enabled: true,
      telemetryEnabled: true,
      onEvent: undefined,
      suggestionLength: undefined,
      audace: undefined,
      partialAcceptance: true,
      smartPrefetch: true,
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isLoading: false,
      isPrefetching: false,
      runState: 'idle',
      abortController: null,
      enabled: this.options.enabled,
      projectId: this.options.projectId,
      chapterId: this.options.chapterId,
      suggestionLength: this.options.suggestionLength,
      audace: this.options.audace,
      partialAcceptance: this.options.partialAcceptance ?? true,
      smartPrefetch: this.options.smartPrefetch ?? true,
      onEvent: this.options.onEvent,
      tracker: new AutocompleteLifecycleTracker(),
      acceptingInsertion: false,
      currentIntent: 'natural',
      prefetchedSuggestion: null,
      prefetchAbortController: null,
      prefetchTelemetry: null,
      idleTimerHandle: null,
      rejectionHintVisible: false,
      rejectionHintTimerHandle: null,
    };
  },

  addCommands() {
    return {
      setAutocompleteEnabled:
        (enabled: boolean) =>
        () => {
          this.storage.enabled = enabled;
          return true;
        },
      setAutocompleteChapterId:
        (chapterId?: string) =>
        () => {
          this.storage.chapterId = chapterId;
          return true;
        },
      setAutocompleteRuntimeOptions:
        (runtimeOptions) =>
        ({ editor }) => {
          const previousChapterId = this.storage.chapterId;
          const previousProjectId = this.storage.projectId;
          Object.assign(this.storage, runtimeOptions);
          if (
            runtimeOptions.enabled === false ||
            runtimeOptions.smartPrefetch === false ||
            ('chapterId' in runtimeOptions && runtimeOptions.chapterId !== previousChapterId) ||
            ('projectId' in runtimeOptions && runtimeOptions.projectId !== previousProjectId)
          ) {
            globalThis.clearTimeout(this.storage.idleTimerHandle ?? undefined);
            this.storage.idleTimerHandle = null;
            this.storage.prefetchAbortController?.abort();
            this.storage.prefetchAbortController = null;
            flushDiscardedPrefetch(this.options, this.storage);
            this.storage.prefetchedSuggestion = null;
            this.storage.isPrefetching = false;
            if (!this.storage.suggestion && !this.storage.isLoading) {
              this.storage.runState = 'idle';
            }
            editor.view.dispatch(editor.state.tr);
          }
          return true;
        },
    };
  },

  onDestroy() {
    globalThis.clearTimeout(this.storage.idleTimerHandle ?? undefined);
    globalThis.clearTimeout(this.storage.rejectionHintTimerHandle ?? undefined);
    this.storage.abortController?.abort();
    this.storage.prefetchAbortController?.abort();
  },

  addKeyboardShortcuts() {
    const numberShortcuts: Record<string, (props: { editor: Editor }) => boolean> = {};
    for (let n = 1; n <= AUTOCOMPLETE_INTENTS.length; n++) {
      numberShortcuts[`Mod-${n}`] = ({ editor }) => {
        const { storage } = this;
        if (!storage.enabled || (!storage.suggestion && !storage.isLoading)) return false;
        const intent = autocompleteIntentByNumber(n);
        if (!intent) return false;
        regenerateWithIntent(editor, storage, this.options, intent);
        return true;
      };
    }

    return {
      ...numberShortcuts,

      Tab: ({ editor }) => {
        const { storage } = this;
        if (!storage.enabled) return false;

        // Promote silent prefetch to visible ghost text
        if (storage.prefetchedSuggestion) {
          storage.suggestion = storage.prefetchedSuggestion;
          storage.prefetchedSuggestion = null;
          storage.runState = 'visible';
          // Promoted, not wasted — its lifecycle is now tracked normally below.
          storage.prefetchTelemetry = null;
          if (this.options.telemetryEnabled !== false) {
            storage.tracker.start({
              projectId: storage.projectId,
              chapterId: storage.chapterId ?? null,
              intent: storage.currentIntent,
              triggerSource: 'prefetch',
            });
            storage.tracker.markFirstToken();
            storage.tracker.markShown(storage.suggestion);
          }
          editor.view.dispatch(editor.state.tr);
          return true;
        }

        // Accept visible suggestion
        if (storage.suggestion) {
          const suggestion = storage.suggestion;
          storage.suggestion = null;
          storage.runState = 'accepting';
          const payload = storage.tracker.accept();
          const pos = editor.state.selection.from;
          storage.acceptingInsertion = true;
          editor.commands.insertContent(suggestion);
          storage.acceptingInsertion = false;
          storage.runState = 'idle';
          emitEvent(this.options, storage, payload);
          if (payload) {
            scheduleDeletionWatch(editor, storage, this.options, payload.suggestionId, suggestion, pos);
          }
          return true;
        }

        if (storage.isLoading) return true;

        storage.currentIntent = 'natural';
        triggerCompletion(editor, storage, this.options);
        return true;
      },

      'Mod-+': ({ editor }) => {
        const { storage } = this;
        if (!storage.enabled || (!storage.suggestion && !storage.isLoading)) return false;
        regenerateWithIntent(
          editor,
          storage,
          this.options,
          nextAutocompleteIntent(storage.currentIntent)
        );
        return true;
      },

      'Mod-ArrowRight': ({ editor }) => {
        return acceptSegment(editor, this.storage, this.options, nextWord);
      },

      'Alt-ArrowRight': ({ editor }) => {
        return acceptSegment(editor, this.storage, this.options, nextFragment);
      },

      Escape: ({ editor }) => {
        const { storage } = this;

        storage.abortController?.abort();
        storage.abortController = null;
        storage.prefetchAbortController?.abort();
        storage.prefetchAbortController = null;
        flushDiscardedPrefetch(this.options, storage);

        const hadVisibleSuggestion = !!(storage.suggestion || storage.isLoading);

        if (storage.suggestion || storage.isLoading) {
          emitEvent(this.options, storage, storage.tracker.reject());
        }

        storage.suggestion = null;
        storage.isLoading = false;
        storage.isPrefetching = false;
        storage.prefetchedSuggestion = null;

        if (hadVisibleSuggestion) {
          storage.rejectionHintVisible = true;
          storage.runState = 'rejected';
          globalThis.clearTimeout(storage.rejectionHintTimerHandle ?? undefined);
          storage.rejectionHintTimerHandle = globalThis.setTimeout(() => {
            storage.rejectionHintVisible = false;
            storage.runState = 'idle';
            editor.view.dispatch(editor.state.tr);
          }, 4000);
          editor.view.dispatch(editor.state.tr);
          return true;
        }

        storage.runState = 'idle';
        editor.view.dispatch(editor.state.tr);
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const extension = this;

    return [
      new Plugin({
        key: autocompletePluginKey,

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply(tr, _oldDecorations) {
            const storage = extension.storage;

            if (tr.docChanged) {
              // Supersede telemetry when the author types instead of accepting
              if (!storage.acceptingInsertion && storage.tracker.hasActive()) {
                globalThis.queueMicrotask(() => {
                  emitEvent(extension.options, storage, storage.tracker.supersede());
                });
              }

              // Stale prefetch + dismiss rejection hint on new typing. A ready
              // prefetch thrown away here is wasted LLM spend → record it.
              flushDiscardedPrefetch(extension.options, storage);
              storage.prefetchedSuggestion = null;
              storage.prefetchAbortController?.abort();
              storage.prefetchAbortController = null;
              storage.isPrefetching = false;
              if (storage.rejectionHintVisible) {
                storage.rejectionHintVisible = false;
              }

              scheduleSmartPrefetchTimer(extension.editor, storage, extension.options);
            } else if (tr.selectionSet) {
              // Cursor moved without typing → prefetch context is stale
              flushDiscardedPrefetch(extension.options, storage);
              storage.prefetchedSuggestion = null;
              storage.prefetchAbortController?.abort();
              storage.prefetchAbortController = null;
              storage.isPrefetching = false;
              scheduleSmartPrefetchTimer(extension.editor, storage, extension.options);
            }

            const {
              isLoading,
              isPrefetching,
              suggestion,
              prefetchedSuggestion,
              rejectionHintVisible,
            } = storage;

            if (
              !isLoading &&
              !isPrefetching &&
              !suggestion &&
              !prefetchedSuggestion &&
              !rejectionHintVisible
            ) {
              return DecorationSet.empty;
            }

            const { selection } = tr;
            if (!selection.empty) return DecorationSet.empty;

            const pos = selection.from;
            const decorations: Decoration[] = [];

            if (isLoading) {
              decorations.push(
                Decoration.widget(pos, () => {
                  const spinner = document.createElement('span');
                  spinner.className = 'autocomplete-spinner';
                  spinner.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-left:2px;animation:spin 1s linear infinite;">
                    <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
                  </svg>`;
                  spinner.style.pointerEvents = 'none';
                  return spinner;
                }, { side: 1 })
              );
            }

            if ((isPrefetching || prefetchedSuggestion) && !suggestion) {
              decorations.push(
                Decoration.widget(pos, () => {
                  const typing = document.createElement('span');
                  typing.className = prefetchedSuggestion
                    ? 'autocomplete-prefetch-typing autocomplete-prefetch-ready'
                    : 'autocomplete-prefetch-typing';
                  typing.setAttribute('aria-hidden', 'true');
                  for (let index = 0; index < 3; index += 1) {
                    const dot = document.createElement('span');
                    typing.appendChild(dot);
                  }
                  if (prefetchedSuggestion) {
                    const key = document.createElement('kbd');
                    key.textContent = 'Tab';
                    typing.appendChild(key);
                  }
                  return typing;
                }, { side: 1 })
              );
            }

            if (suggestion) {
              decorations.push(
                Decoration.widget(pos, () => {
                  const span = document.createElement('span');
                  span.className = 'autocomplete-ghost';
                  span.textContent = suggestion;
                  return span;
                }, { side: 0 })
              );
              decorations.push(
                Decoration.widget(pos, () => {
                  return createAutocompleteHint(extension.storage.currentIntent);
                }, { side: 2 })
              );
            }

            if (rejectionHintVisible && !suggestion) {
              const projectId = extension.storage.projectId;
              decorations.push(
                Decoration.widget(pos, () => {
                  const span = document.createElement('span');
                  span.className = 'autocomplete-hint autocomplete-hint-compact autocomplete-rejection-hint';
                  span.textContent = 'Ignoré · ';
                  if (projectId) {
                    const link = document.createElement('a');
                    link.textContent = 'Ajuster';
                    link.href = `/project/${projectId}/cockpit/settings#autocomplete`;
                    span.appendChild(link);
                  }
                  return span;
                }, { side: 1 })
              );
            }

            return DecorationSet.create(tr.doc, decorations);
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
