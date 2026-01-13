// ABOUTME: TipTap extension for AI-powered text autocompletion
// ABOUTME: Shows ghost text suggestions on Tab, accepts with second Tab

import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

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
   * Whether to use streaming mode
   */
  useStreaming: boolean;
  /**
   * Whether autocompletion is enabled
   */
  enabled: boolean;
}

export interface AutocompleteStorage {
  suggestion: string | null;
  isLoading: boolean;
  abortController: AbortController | null;
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autocomplete: {
      /**
       * Set whether autocompletion is enabled
       */
      setAutocompleteEnabled: (enabled: boolean) => ReturnType;
    };
  }
}

const autocompletePluginKey = new PluginKey('autocomplete');

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

  // Get text content before cursor (up to 500 chars for context)
  const textBefore = doc.textBetween(Math.max(0, pos - 500), pos, '\n', '\n');

  // Get text content after cursor (up to 100 chars for context)
  const textAfter = doc.textBetween(
    pos,
    Math.min(doc.content.size, pos + 100),
    '\n',
    '\n'
  );

  // Don't trigger if no text before cursor
  if (!textBefore.trim()) {
    return;
  }

  storage.isLoading = true;

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
      useStreaming: true,
      enabled: true,
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isLoading: false,
      abortController: null,
      enabled: this.options.enabled,
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

          // Insert the suggestion at cursor position
          editor.commands.insertContent(suggestion);

          return true;
        }

        // If already loading, do nothing
        if (storage.isLoading) {
          return true;
        }

        // Trigger completion request
        triggerCompletion(editor, storage, this.options);

        return true;
      },
      Escape: () => {
        const { storage } = this;

        // Cancel ongoing request
        if (storage.abortController) {
          storage.abortController.abort();
          storage.abortController = null;
        }

        // Cancel current suggestion
        if (storage.suggestion || storage.isLoading) {
          storage.suggestion = null;
          storage.isLoading = false;
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: autocompletePluginKey,

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply(tr, oldDecorations) {
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
