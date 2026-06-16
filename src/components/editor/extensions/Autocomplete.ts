// ABOUTME: TipTap extension for AI-powered text autocompletion
// ABOUTME: Silent prefetch on idle → breathing dot → ghost text on Tab → accept

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
  prefetchedSuggestion: string | null;
  prefetchAbortController: AbortController | null;
  idleTimerHandle: ReturnType<typeof globalThis.setTimeout> | null;
  rejectionHintVisible: boolean;
  rejectionHintTimerHandle: ReturnType<typeof globalThis.setTimeout> | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autocomplete: {
      setAutocompleteEnabled: (enabled: boolean) => ReturnType;
      setAutocompleteChapterId: (chapterId?: string) => ReturnType;
    };
  }
}

const autocompletePluginKey = new PluginKey('autocomplete');

const DELETION_WATCH_MS = 30000;

/** Returns true if text ends with a sentence-boundary character. */
export function endsWithSentenceBoundary(text: string): boolean {
  return /[.!?…]\s*$/.test(text.trimEnd());
}

function emitEvent(
  options: AutocompleteOptions,
  payload: LifecyclePayload | DeletionPayload | null
): void {
  if (payload && options.telemetryEnabled !== false && options.onEvent) {
    options.onEvent(payload);
  }
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
  if (!storage.enabled || !storage.suggestion || options.partialAcceptance === false) {
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
    emitEvent(options, storage.tracker.accept());
  } else {
    editor.view.dispatch(editor.state.tr);
  }
  return true;
}

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

function buildContext(
  editor: Editor
): { textBefore: string; textAfter: string } {
  const { state } = editor;
  const { selection, doc } = state;
  const pos = selection.from;
  const textBefore = doc.textBetween(Math.max(0, pos - 3000), pos, '\n', '\n');
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

  storage.isLoading = true;

  if (options.telemetryEnabled !== false) {
    storage.tracker.start({
      projectId: options.projectId,
      chapterId: storage.chapterId ?? null,
      intent: storage.currentIntent,
    });
  }

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
          storage.tracker.markFirstToken();
          storage.tracker.markShown(suggestion);
        } else {
          emitEvent(options, storage.tracker.finishEmpty());
        }
        editor.view.dispatch(editor.state.tr);
      })
      .catch(() => {
        storage.isLoading = false;
        editor.view.dispatch(editor.state.tr);
      });
  }
}

function triggerPrefetch(
  editor: Editor,
  storage: AutocompleteStorage,
  options: AutocompleteOptions
): void {
  if (storage.isLoading || storage.prefetchedSuggestion || storage.suggestion) return;

  const { textBefore, textAfter } = buildContext(editor);
  if (!textBefore.trim()) return;

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
        projectId: options.projectId,
        textBeforeCursor: textBefore,
        textAfterCursor: textAfter,
        chapterId: storage.chapterId,
        intent: storage.currentIntent,
        suggestionLength: options.suggestionLength,
        audace: options.audace,
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

            if (!isPrefetch && parsed.type === 'metadata') {
              storage.tracker.setProviderMetadata(
                typeof parsed.providerType === 'string' ? parsed.providerType : null,
                typeof parsed.model === 'string' ? parsed.model : null,
                typeof parsed.canonFactsCount === 'number' ? parsed.canonFactsCount : null
              );
              continue;
            }

            if (parsed.text) {
              if (!isPrefetch) storage.tracker.markFirstToken();
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
      if (accumulated.trim().length === 0) {
        emitEvent(options, storage.tracker.finishEmpty());
      } else {
        storage.tracker.markShown(accumulated);
      }
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
      telemetryEnabled: true,
      onEvent: undefined,
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
      tracker: new AutocompleteLifecycleTracker(),
      acceptingInsertion: false,
      currentIntent: 'natural',
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
          if (this.options.telemetryEnabled !== false) {
            storage.tracker.start({
              projectId: this.options.projectId,
              chapterId: storage.chapterId ?? null,
              intent: storage.currentIntent,
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
          const payload = storage.tracker.accept();
          const pos = editor.state.selection.from;
          storage.acceptingInsertion = true;
          editor.commands.insertContent(suggestion);
          storage.acceptingInsertion = false;
          emitEvent(this.options, payload);
          if (payload) {
            scheduleDeletionWatch(editor, this.options, payload.suggestionId, suggestion, pos);
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

        const hadSuggestion = !!(
          storage.suggestion ||
          storage.isLoading ||
          storage.prefetchedSuggestion
        );

        if (storage.suggestion || storage.isLoading) {
          emitEvent(this.options, storage.tracker.reject());
        }

        storage.suggestion = null;
        storage.isLoading = false;
        storage.prefetchedSuggestion = null;

        if (hadSuggestion) {
          storage.rejectionHintVisible = true;
          globalThis.clearTimeout(storage.rejectionHintTimerHandle ?? undefined);
          storage.rejectionHintTimerHandle = globalThis.setTimeout(() => {
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

            if (tr.docChanged) {
              // Supersede telemetry when the author types instead of accepting
              if (!storage.acceptingInsertion && storage.tracker.hasActive()) {
                globalThis.queueMicrotask(() => {
                  emitEvent(extension.options, storage.tracker.supersede());
                });
              }

              // Stale prefetch + dismiss rejection hint on new typing
              storage.prefetchedSuggestion = null;
              storage.prefetchAbortController?.abort();
              storage.prefetchAbortController = null;
              if (storage.rejectionHintVisible) {
                storage.rejectionHintVisible = false;
              }

              // Reset idle timer — only doc changes restart the 10s countdown
              globalThis.clearTimeout(storage.idleTimerHandle ?? undefined);
              storage.idleTimerHandle = globalThis.setTimeout(() => {
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
              // Cursor moved without typing → prefetch context is stale
              storage.prefetchedSuggestion = null;
              storage.prefetchAbortController?.abort();
              storage.prefetchAbortController = null;
            }

            const { isLoading, suggestion, prefetchedSuggestion, rejectionHintVisible } = storage;

            if (!isLoading && !suggestion && !prefetchedSuggestion && !rejectionHintVisible) {
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
              const projectId = extension.options.projectId;
              decorations.push(
                Decoration.widget(pos, () => {
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
