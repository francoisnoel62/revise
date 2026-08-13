// ABOUTME: Hook to drive dictionary-based spell checking in the TipTap editor
// ABOUTME: Extracts words from the document, checks them server-side, dispatches decorations

import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { textIssuePluginKey } from '@/components/editor/TextIssueExtension';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import {
  locateWords,
  spellingIssueAt,
  type LocatedWord,
} from '@/domain/value-objects/LocatedWord';
import {
  checkSpellingAction,
  getCustomDictionaryAction,
  addWordToCustomDictionaryAction,
  getIgnoredWordsAction,
  addIgnoredWordAction,
} from '@/app/actions/spell-check-actions';

function extractWordsFromDoc(editor: Editor): LocatedWord[] {
  const result: LocatedWord[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    result.push(...locateWords(node.text, pos));
  });

  return result;
}

/** Drops the underlines of a word the author just accepted, without re-running a check. */
function clearSpellingIssuesFor(editor: Editor | null, word: string): void {
  if (!editor || editor.isDestroyed) return;
  const pluginState = textIssuePluginKey.getState(editor.state);
  if (!pluginState) return;

  const spelling = pluginState.spelling.filter((issue) => issue.text !== word);
  editor.view.dispatch(editor.state.tr.setMeta(textIssuePluginKey, { spelling }));
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

export function useSpellCheck(
  editor: Editor | null,
  projectId?: string
): {
  ignoreWord: (word: string) => void;
  addToDictionary: (word: string) => Promise<void>;
} {
  const lastTextRef = useRef<string>('');
  const customDictionaryRef = useRef<string[]>([]);
  const ignoredWordsRef = useRef<string[]>([]);

  // Load per-project custom dictionary and ignored words on mount / when projectId changes
  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      getCustomDictionaryAction(projectId),
      getIgnoredWordsAction(projectId),
    ]).then(([dictionary, ignored]) => {
      customDictionaryRef.current = dictionary;
      ignoredWordsRef.current = ignored;
      lastTextRef.current = '';
    });
  }, [projectId]);

  const runCheck = useCallback(async (ed: Editor) => {
    const currentText = ed.getText();
    if (currentText === lastTextRef.current) return;
    lastTextRef.current = currentText;

    const uniqueWords = [...new Set(extractWordsFromDoc(ed).map((w) => w.word))];

    if (uniqueWords.length === 0) {
      if (!ed.isDestroyed) {
        ed.view.dispatch(ed.state.tr.setMeta(textIssuePluginKey, { spelling: [] }));
      }
      return;
    }

    // Merge custom dictionary + ignored words — both are excluded from flagging
    const accepted = [...customDictionaryRef.current, ...ignoredWordsRef.current];
    const misspelled = await checkSpellingAction(uniqueWords, accepted);
    if (ed.isDestroyed) return;

    // Locate the words again rather than reusing what was found before the round trip:
    // the author goes on writing while it is in flight, and a range located in the
    // document as it was would have the correction replace the wrong text — a single
    // character adrift is enough to swallow the space before the word. Everything from
    // here to the dispatch is synchronous, so nothing can move in between.
    const wordsWithPositions = extractWordsFromDoc(ed);

    // Keyed on the word exactly as the server saw it. The server accepts a capitalised word
    // unconditionally — proper nouns and sentence starts — so folding case here would hand
    // "Maisson" the underline the server deliberately withheld while flagging "maisson".
    const misspelledMap = new Map(misspelled.map((m) => [m.word, m.suggestions]));

    // Filter locally too — guards against stale server responses and test mocks
    const locallyAccepted = new Set([
      ...customDictionaryRef.current,
      ...ignoredWordsRef.current,
    ]);

    const spelling: TextIssue[] = wordsWithPositions
      .filter((w) => misspelledMap.has(w.word))
      .filter((w) => !locallyAccepted.has(w.word))
      .map((w) => spellingIssueAt(w, misspelledMap.get(w.word) ?? []));

    if (!ed.isDestroyed) {
      ed.view.dispatch(ed.state.tr.setMeta(textIssuePluginKey, { spelling }));
    }
  }, []);

  const ignoreWord = useCallback(
    (word: string) => {
      // Always track locally so subsequent runCheck calls exclude this word
      if (!ignoredWordsRef.current.includes(word)) {
        ignoredWordsRef.current = [...ignoredWordsRef.current, word];
      }
      // Persist per-project when possible. Deliberately not awaited — the underline goes
      // away at once, which is the whole point — but a rejection has to be reported rather
      // than become an unhandled promise: the author's choice is lost on the next reload,
      // and silence is the one response that leaves them no way to know.
      if (projectId) {
        addIgnoredWordAction(projectId, word).catch((error: unknown) => {
          console.error(`Le mot ignoré « ${word} » n'a pas pu être enregistré`, error);
        });
      }
      // Remove the decoration immediately
      clearSpellingIssuesFor(editor, word);
    },
    [editor, projectId]
  );

  const addToDictionary = useCallback(
    async (word: string) => {
      if (!projectId) return;
      await addWordToCustomDictionaryAction(projectId, word);
      customDictionaryRef.current = [...customDictionaryRef.current, word];
      clearSpellingIssuesFor(editor, word);
      lastTextRef.current = '';
    },
    [editor, projectId]
  );

  useEffect(() => {
    if (!editor) return;

    const debouncedFn = debounce(runCheck, 900);
    const handleUpdate = () => debouncedFn(editor);

    editor.on('update', handleUpdate);
    handleUpdate();

    return () => {
      editor.off('update', handleUpdate);
      debouncedFn.cancel();
    };
  }, [editor, runCheck]);

  return { ignoreWord, addToDictionary };
}
