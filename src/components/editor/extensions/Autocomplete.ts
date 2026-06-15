// ABOUTME: TipTap extension for AI-powered text autocompletion
// ABOUTME: Shows ghost text suggestions on Tab, accepts with second Tab

import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  AutocompleteLifecycleTracker,
  type LifecyclePayload,
  type DeletionPayload,
} from './autocompleteTelemetry';
import { nextWord, nextFragment } from './suggestionSegments';
import {
  type AutocompleteIntent,
  nextAutocompleteIntent,
} from '@/domain/value-objects/AutocompleteIntent';

export interface AutocompleteOptions {
  /**
   * Function to fetch completion from server (non-streaming)
   */
  onComplete: (
    textBeforeCursor: string,
    textAfterCursor: string
  ) => Promise<string | null>;
  /**
   * Project ID for streaming completions
   */
  projectId?: string;
  /**
   * Current chapter ID — used to inject chapter-linked research docs as context
   */
  chapterId?: string;
  /**
   * Whether to use streaming mode
   */
  useStreaming: boolean;
  /**
   * Whether autocompletion is enabled
   */
  enabled: boolean;
  /**
   * Whether to emit instrumentation events (measurement only, no UX change)
   */
  telemetryEnabled?: boolean;
  /**
   * Sink for instrumentation events (fire-and-forget)
   */
  onEvent?: (payload: LifecyclePayload | DeletionPayload) => void;
}

export interface AutocompleteStorage {
  suggestion: string | null;
  isLoading: boolean;
  abortController: AbortController | null;
  enabled: boolean;
  chapterId?: string;
  tracker: AutocompleteLifecycleTracker;
  acceptingInsertion: boolean;
  currentIntent: AutocompleteIntent;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autocomplete: {
      /**
       * Set whether autocompletion is enabled
       */
      setAutocompleteEnabled: (enabled: boolean) => ReturnType;
      /**
       * Set the current chapter ID (for chapter-linked research context)
       */
      setAutocompleteChapterId: (chapterId?: string) => ReturnType;
    };
  }
}

const autocompletePluginKey = new PluginKey('autocomplete');

// Window (ms) to watch whether an accepted suggestion is deleted shortly after insertion.
const DELETION_WATCH_MS = 30000;

/**
 * Forward a telemetry payload to the sink, respecting the enabled flag. No-op on null.
 */
function emitEvent(
  options: AutocompleteOptions,
  payload: LifecyclePayload | DeletionPayload | null
): void {
  if (payload && options.telemetryEnabled !== false && options.onEvent) {
    options.onEvent(payload);
  }
}

/**
 * Accept the next segment (word or fragment) of the current suggestion, keeping the rest
 * as ghost text. Records the partial acceptance; if nothing remains, the lifecycle is complete.
 */
function acceptSegment(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions,
  splitter: (s: string) => { take: string; rest: string }
): boolean {
  if (!storage.enabled || !storage.suggestion) {
    return false;
  }
  const { take, rest } = splitter(storage.suggestion);
  if (!take) {
    return false;
  }

  storage.acceptingInsertion = true;
  editor.commands.insertContent(take);
  storage.acceptingInsertion = false;

  storage.tracker.recordPartialAccept(take);
  storage.suggestion = rest || null;

  if (!storage.suggestion) {
    // Whole suggestion consumed piecewise → full acceptance.
    emitEvent(options, storage.tracker.accept());
  } else {
    editor.view.dispatch(editor.state.tr);
  }
  return true;
}

/**
 * After an accepted suggestion, check once (after a delay) whether the inserted
 * text was removed; if so, emit a deletion event. Best-effort, never blocks.
 */
function scheduleDeletionWatch(
  editor: Editor,
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
      emitEvent(options, {
        type: 'deletion',
        suggestionId,
        deletedAfterMs: Date.now() - acceptedAt,
      });
    }
  }, DELETION_WATCH_MS);
}

/**
 * Trigger completion request (non-streaming)
 */
function triggerCompletion(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions
): void {
  if (storage.isLoading) {
    return;
  }

  // Get text before and after cursor
  const { state } = editor;
  const { selection, doc } = state;
  const pos = selection.from;

  // Get text content before cursor (immediate local window; chapter context is added server-side)
  const textBefore = doc.textBetween(Math.max(0, pos - 1000), pos, '\n', '\n');

  // Get text content after cursor
  const textAfter = doc.textBetween(
    pos,
    Math.min(doc.content.size, pos + 200),
    '\n',
    '\n'
  );

  // Don't trigger if no text before cursor
  if (!textBefore.trim()) {
    return;
  }

  storage.isLoading = true;

  // Begin instrumentation lifecycle for this suggestion (measurement only)
  if (options.telemetryEnabled !== false) {
    storage.tracker.start({
      projectId: options.projectId,
      chapterId: storage.chapterId ?? null,
      intent: storage.currentIntent,
    });
  }

  // Force view update to show spinner immediately
  editor.view.dispatch(editor.state.tr);

  if (options.useStreaming && options.projectId) {
    // Use streaming mode
    streamCompletion(editor, storage, options, textBefore, textAfter);
  } else {
    // Use non-streaming mode
    options
      .onComplete(textBefore, textAfter)
      .then((suggestion) => {
        storage.isLoading = false;

        if (suggestion) {
          storage.suggestion = suggestion;
          storage.tracker.markFirstToken();
          storage.tracker.markShown(suggestion);
        } else {
          emitEvent(options, storage.tracker.finishEmpty());
        }
        // Force view update to show ghost text or remove spinner
        editor.view.dispatch(editor.state.tr);
      })
      .catch(() => {
        storage.isLoading = false;
        // Force view update to remove spinner
        editor.view.dispatch(editor.state.tr);
      });
  }
}

/**
 * Stream completion from SSE endpoint
 */
async function streamCompletion(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions,
  textBefore: string,
  textAfter: string
): Promise<void> {
  // Create abort controller for cancellation
  const abortController = new AbortController();
  storage.abortController = abortController;

  try {
    const response = await fetch('/api/completion/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: options.projectId,
        textBeforeCursor: textBefore,
        textAfterCursor: textAfter,
        chapterId: storage.chapterId,
        intent: storage.currentIntent,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch completion');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              // First token latency (perceived) — idempotent
              storage.tracker.markFirstToken();
              accumulated += parsed.text;
              storage.suggestion = accumulated;

              // Force view update to show updated ghost text
              editor.view.dispatch(editor.state.tr);
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    storage.isLoading = false;
    storage.abortController = null;

    // Instrumentation: empty response (silence) vs shown suggestion
    if (accumulated.trim().length === 0) {
      emitEvent(options, storage.tracker.finishEmpty());
    } else {
      storage.tracker.markShown(accumulated);
    }

    // Force view update to remove spinner
    editor.view.dispatch(editor.state.tr);
  } catch (error) {
    storage.isLoading = false;
    storage.abortController = null;

    // Force view update to remove spinner
    editor.view.dispatch(editor.state.tr);

    // Don't log abort errors (user cancelled)
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
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isLoading: false,
      abortController: null,
      enabled: this.options.enabled,
      chapterId: this.options.chapterId,
      tracker: new AutocompleteLifecycleTracker(),
      acceptingInsertion: false,
      currentIntent: 'natural',
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
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { storage } = this;

        if (!storage.enabled) {
          return false;
        }

        // If we have a suggestion, insert it
        if (storage.suggestion) {
          const suggestion = storage.suggestion;
          storage.suggestion = null;

          // Capture instrumentation before mutating the document
          const payload = storage.tracker.accept();
          const pos = editor.state.selection.from;

          // Insert the suggestion at cursor position
          storage.acceptingInsertion = true;
          editor.commands.insertContent(suggestion);
          storage.acceptingInsertion = false;

          emitEvent(this.options, payload);
          if (payload) {
            scheduleDeletionWatch(
              editor,
              this.options,
              payload.suggestionId,
              suggestion,
              pos
            );
          }

          return true;
        }

        // If already loading, do nothing
        if (storage.isLoading) {
          return true;
        }

        // A fresh trigger starts from the natural intent.
        storage.currentIntent = 'natural';
        triggerCompletion(editor, storage, this.options);

        return true;
      },
      'Mod-.': ({ editor }) => {
        // Discreet "regenerate with another flavor": cycle the intent and re-request.
        const { storage } = this;
        if (!storage.enabled || (!storage.suggestion && !storage.isLoading)) {
          return false;
        }
        storage.currentIntent = nextAutocompleteIntent(storage.currentIntent);
        if (storage.abortController) {
          storage.abortController.abort();
          storage.abortController = null;
        }
        storage.suggestion = null;
        storage.isLoading = false;
        triggerCompletion(editor, storage, this.options);
        return true;
      },
      'Mod-ArrowRight': ({ editor }) => {
        // Accept the next word, keep the rest as ghost text.
        return acceptSegment(editor, this.storage, this.options, nextWord);
      },
      'Alt-ArrowRight': ({ editor }) => {
        // Accept the next fragment (up to the next strong punctuation).
        return acceptSegment(editor, this.storage, this.options, nextFragment);
      },
      Escape: ({ editor }) => {
        const { storage } = this;

        // Cancel ongoing request
        if (storage.abortController) {
          storage.abortController.abort();
          storage.abortController = null;
        }

        // Cancel current suggestion
        if (storage.suggestion || storage.isLoading) {
          emitEvent(this.options, storage.tracker.reject());
          storage.suggestion = null;
          storage.isLoading = false;
          editor.view.dispatch(editor.state.tr);
          return true;
        }
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
            // Instrumentation: the author typed instead of accepting → superseded.
            // Measurement only; does not alter the suggestion/decoration behavior.
            if (
              tr.docChanged &&
              !extension.storage.acceptingInsertion &&
              extension.storage.tracker.hasActive()
            ) {
              globalThis.queueMicrotask(() => {
                emitEvent(extension.options, extension.storage.tracker.supersede());
              });
            }

            const { isLoading, suggestion } = extension.storage;

            // Clear decorations if not loading and no suggestion
            if (!isLoading && !suggestion) {
              return DecorationSet.empty;
            }

            // Create decoration at cursor position
            const { selection } = tr;
            if (!selection.empty) {
              return DecorationSet.empty;
            }

            const pos = selection.from;
            const decorations: Decoration[] = [];

            // Show spinner while loading (before or during streaming)
            if (isLoading) {
              const spinnerWidget = Decoration.widget(pos, () => {
                const spinner = document.createElement('span');
                spinner.className = 'autocomplete-spinner';
                spinner.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-left:2px;animation:spin 1s linear infinite;">
                  <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
                  <circle cx="12" cy="12" r="10" stroke="#9ca3af" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
                </svg>`;
                spinner.style.pointerEvents = 'none';
                return spinner;
              }, { side: 1 }); // side: 1 means after the ghost text

              decorations.push(spinnerWidget);
            }

            // Show ghost text if we have a suggestion
            if (suggestion) {
              const ghostWidget = Decoration.widget(pos, () => {
                const span = document.createElement('span');
                span.className = 'autocomplete-ghost';
                span.textContent = suggestion;
                span.style.color = '#9ca3af';
                span.style.fontStyle = 'italic';
                span.style.pointerEvents = 'none';
                return span;
              }, { side: 0 }); // side: 0 means before spinner

              decorations.push(ghostWidget);
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
