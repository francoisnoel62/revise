// ABOUTME: TipTap extension for AI-powered text autocompletion
// ABOUTME: Shows ghost text suggestions on Tab, accepts with second Tab

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface AutocompleteOptions {
  /**
   * Function to fetch completion from server
   */
  onComplete: (
    textBeforeCursor: string,
    textAfterCursor: string
  ) => Promise<string | null>;
  /**
   * Whether autocompletion is enabled
   */
  enabled: boolean;
}

export interface AutocompleteStorage {
  suggestion: string | null;
  isLoading: boolean;
}

const autocompletePluginKey = new PluginKey('autocomplete');

export const Autocomplete = Extension.create<AutocompleteOptions, AutocompleteStorage>({
  name: 'autocomplete',

  addOptions() {
    return {
      onComplete: async () => null,
      enabled: true,
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isLoading: false,
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (!this.options.enabled) {
          return false;
        }

        const { storage } = this;

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
        this.triggerCompletion(editor);

        return true;
      },
      Escape: () => {
        // Cancel current suggestion
        if (this.storage.suggestion) {
          this.storage.suggestion = null;
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
            // Clear decorations if suggestion is cleared
            if (!extension.storage.suggestion) {
              return DecorationSet.empty;
            }

            // Create ghost text decoration at cursor position
            const { selection } = tr;
            if (!selection.empty) {
              return DecorationSet.empty;
            }

            const pos = selection.from;
            const ghostWidget = Decoration.widget(pos, () => {
              const span = document.createElement('span');
              span.className = 'autocomplete-ghost';
              span.textContent = extension.storage.suggestion || '';
              span.style.color = '#9ca3af';
              span.style.fontStyle = 'italic';
              span.style.pointerEvents = 'none';
              return span;
            });

            return DecorationSet.create(tr.doc, [ghostWidget]);
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

  // Helper method to trigger completion
  triggerCompletion(editor: ReturnType<typeof Extension.create>['editor']) {
    const { storage, options } = this;

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
    const textAfter = doc.textBetween(pos, Math.min(doc.content.size, pos + 100), '\n', '\n');

    // Don't trigger if no text before cursor
    if (!textBefore.trim()) {
      return;
    }

    storage.isLoading = true;

    options
      .onComplete(textBefore, textAfter)
      .then((suggestion) => {
        storage.isLoading = false;

        if (suggestion) {
          storage.suggestion = suggestion;
          // Force view update to show ghost text
          editor.view.dispatch(editor.state.tr);
        }
      })
      .catch(() => {
        storage.isLoading = false;
      });
  },
});
