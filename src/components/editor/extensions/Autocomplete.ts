// ABOUTME: TipTap extension for AI-powered text autocompletion
// ABOUTME: Silent prefetch on idle, breathing dot in margin, ghost text on Tab

import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { SuggestionLength, AudaceLevel } from '@/domain/value-objects/AutocompletePreferences';

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
   * Preferred suggestion length sent to the API
   */
  suggestionLength?: SuggestionLength;
  /**
   * AI boldness level sent to the API
   */
  audace?: AudaceLevel;
  /**
   * Whether Mod-ArrowRight / Alt-ArrowRight accept one word at a time
   */
  partialAcceptance?: boolean;
}

export interface AutocompleteStorage {
  suggestion: string | null;
  isLoading: boolean;
  abortController: AbortController | null;
  enabled: boolean;
  chapterId?: string;
  prefetchedSuggestion: string | null;
  prefetchAbortController: AbortController | null;
  idleTimerHandle: ReturnType<typeof globalThis.setTimeout> | null;
  rejectionHintVisible: boolean;
  rejectionHintTimerHandle: ReturnType<typeof globalThis.setTimeout> | null;
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

/**
 * Returns true if text ends with a sentence-boundary character.
 * Exported for unit testing.
 */
export function endsWithSentenceBoundary(text: string): boolean {
  return /[.!?…]\s*$/.test(text.trimEnd());
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

  const { state } = editor;
  const { selection, doc } = state;
  const pos = selection.from;

  const textBefore = doc.textBetween(Math.max(0, pos - 500), pos, '\n', '\n');
  const textAfter = doc.textBetween(
    pos,
    Math.min(doc.content.size, pos + 100),
    '\n',
    '\n'
  );

  if (!textBefore.trim()) {
    return;
  }

  storage.isLoading = true;
  editor.view.dispatch(editor.state.tr);

  if (options.useStreaming && options.projectId) {
    streamCompletion(editor, storage, options, textBefore, textAfter, false);
  } else {
    options
      .onComplete(textBefore, textAfter)
      .then((suggestion) => {
        storage.isLoading = false;
        if (suggestion) {
          storage.suggestion = suggestion;
        }
        editor.view.dispatch(editor.state.tr);
      })
      .catch(() => {
        storage.isLoading = false;
        editor.view.dispatch(editor.state.tr);
      });
  }
}

/**
 * Silently pre-fetch a suggestion without triggering isLoading.
 * Result is stored in prefetchedSuggestion; the dot indicator reflects this.
 */
function triggerPrefetch(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions
): void {
  if (storage.isLoading || storage.prefetchedSuggestion || storage.suggestion) {
    return;
  }

  const { state } = editor;
  const { selection, doc } = state;
  const pos = selection.from;

  const textBefore = doc.textBetween(Math.max(0, pos - 500), pos, '\n', '\n');
  const textAfter = doc.textBetween(
    pos,
    Math.min(doc.content.size, pos + 100),
    '\n',
    '\n'
  );

  if (!textBefore.trim()) {
    return;
  }

  if (options.useStreaming && options.projectId) {
    streamCompletion(editor, storage, options, textBefore, textAfter, true);
  } else {
    options
      .onComplete(textBefore, textAfter)
      .then((suggestion) => {
        if (suggestion) {
          storage.prefetchedSuggestion = suggestion;
          editor.view.dispatch(editor.state.tr);
        }
      })
      .catch(() => {
        // Silent failure — prefetch is best-effort
      });
  }
}

/**
 * Stream completion from SSE endpoint.
 * isPrefetch=true → writes to prefetchedSuggestion; isPrefetch=false → writes to suggestion + isLoading.
 */
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: options.projectId,
        textBeforeCursor: textBefore,
        textAfterCursor: textAfter,
        chapterId: storage.chapterId,
        suggestionLength: options.suggestionLength,
        audace: options.audace,
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
              accumulated += parsed.text;
              if (isPrefetch) {
                storage.prefetchedSuggestion = accumulated;
              } else {
                storage.suggestion = accumulated;
              }
              editor.view.dispatch(editor.state.tr);
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    if (isPrefetch) {
      storage.prefetchAbortController = null;
    } else {
      storage.isLoading = false;
      storage.abortController = null;
    }

    editor.view.dispatch(editor.state.tr);
  } catch (error) {
    if (isPrefetch) {
      storage.prefetchAbortController = null;
    } else {
      storage.isLoading = false;
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
      suggestionLength: undefined,
      audace: undefined,
      partialAcceptance: true,
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isLoading: false,
      abortController: null,
      enabled: this.options.enabled,
      chapterId: this.options.chapterId,
      prefetchedSuggestion: null,
      prefetchAbortController: null,
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
    };
  },

  onDestroy() {
    clearTimeout(this.storage.idleTimerHandle ?? undefined);
    clearTimeout(this.storage.rejectionHintTimerHandle ?? undefined);
    this.storage.abortController?.abort();
    this.storage.prefetchAbortController?.abort();
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { storage } = this;

        if (!storage.enabled) {
          return false;
        }

        // Promote prefetched suggestion to visible ghost text
        if (storage.prefetchedSuggestion) {
          storage.suggestion = storage.prefetchedSuggestion;
          storage.prefetchedSuggestion = null;
          editor.view.dispatch(editor.state.tr);
          return true;
        }

        // Accept the visible suggestion
        if (storage.suggestion) {
          const suggestion = storage.suggestion;
          storage.suggestion = null;
          editor.commands.insertContent(suggestion);
          return true;
        }

        // Already fetching — wait
        if (storage.isLoading) {
          return true;
        }

        // On-demand fetch
        triggerCompletion(editor, storage, this.options);
        return true;
      },

      'Mod-ArrowRight': ({ editor }) => {
        const { storage } = this;
        if (!storage.enabled || !storage.suggestion || !this.options.partialAcceptance) {
          return false;
        }
        const match = storage.suggestion.match(/^\S+\s*/);
        if (!match) return false;
        const word = match[0];
        storage.suggestion = storage.suggestion.slice(word.length) || null;
        editor.commands.insertContent(word);
        return true;
      },

      'Alt-ArrowRight': ({ editor }) => {
        const { storage } = this;
        if (!storage.enabled || !storage.suggestion || !this.options.partialAcceptance) {
          return false;
        }
        const match = storage.suggestion.match(/^\S+\s*/);
        if (!match) return false;
        const word = match[0];
        storage.suggestion = storage.suggestion.slice(word.length) || null;
        editor.commands.insertContent(word);
        return true;
      },

      Escape: ({ editor }) => {
        const { storage } = this;

        storage.abortController?.abort();
        storage.abortController = null;
        storage.prefetchAbortController?.abort();
        storage.prefetchAbortController = null;

        const hadSuggestion = !!(
          storage.suggestion ||
          storage.isLoading ||
          storage.prefetchedSuggestion
        );

        storage.suggestion = null;
        storage.isLoading = false;
        storage.prefetchedSuggestion = null;

        if (hadSuggestion) {
          storage.rejectionHintVisible = true;
          clearTimeout(storage.rejectionHintTimerHandle ?? undefined);
          storage.rejectionHintTimerHandle = setTimeout(() => {
            storage.rejectionHintVisible = false;
            editor.view.dispatch(editor.state.tr);
          }, 4000);
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
            const storage = extension.storage;

            // Manage idle timer: reset on doc change, clear prefetch on cursor move
            if (tr.docChanged) {
              clearTimeout(storage.idleTimerHandle ?? undefined);
              storage.idleTimerHandle = null;
              storage.prefetchedSuggestion = null;
              storage.prefetchAbortController?.abort();
              storage.prefetchAbortController = null;

              // Clear rejection hint when author resumes writing
              if (storage.rejectionHintVisible) {
                storage.rejectionHintVisible = false;
              }

              // Schedule prefetch after 10s idle
              storage.idleTimerHandle = setTimeout(() => {
                const { state } = extension.editor;
                const pos = state.selection.from;
                const textBefore = state.doc.textBetween(
                  Math.max(0, pos - 500),
                  pos,
                  '\n',
                  '\n'
                );
                if (
                  endsWithSentenceBoundary(textBefore) &&
                  !storage.suggestion &&
                  storage.enabled
                ) {
                  triggerPrefetch(extension.editor, storage, extension.options);
                }
              }, 10000);
            } else if (tr.selectionSet) {
              // Cursor moved without writing → context is stale
              storage.prefetchedSuggestion = null;
              storage.prefetchAbortController?.abort();
              storage.prefetchAbortController = null;
            }

            const { isLoading, suggestion, prefetchedSuggestion, rejectionHintVisible } =
              storage;

            // No active state: clear decorations
            if (!isLoading && !suggestion && !prefetchedSuggestion && !rejectionHintVisible) {
              return DecorationSet.empty;
            }

            const { selection } = tr;
            if (!selection.empty) {
              return DecorationSet.empty;
            }

            const pos = selection.from;
            const decorations: Decoration[] = [];

            // Spinner while fetching on-demand
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
              }, { side: 1 });

              decorations.push(spinnerWidget);
            }

            // Ghost text for visible suggestion
            if (suggestion) {
              const ghostWidget = Decoration.widget(pos, () => {
                const span = document.createElement('span');
                span.className = 'autocomplete-ghost';
                span.textContent = suggestion;
                span.style.color = '#9ca3af';
                span.style.fontStyle = 'italic';
                span.style.pointerEvents = 'none';
                return span;
              }, { side: 0 });

              decorations.push(ghostWidget);
            }

            // Rejection hint after Escape
            if (rejectionHintVisible && !suggestion) {
              const projectId = extension.options.projectId;
              const hintWidget = Decoration.widget(pos, () => {
                const span = document.createElement('span');
                span.className = 'autocomplete-rejection-hint';
                span.textContent = 'Rejeté · ';
                if (projectId) {
                  const link = document.createElement('a');
                  link.textContent = 'Préférences →';
                  link.href = `/project/${projectId}/cockpit/settings#autocomplete`;
                  span.appendChild(link);
                }
                return span;
              }, { side: 1 });

              decorations.push(hintWidget);
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
