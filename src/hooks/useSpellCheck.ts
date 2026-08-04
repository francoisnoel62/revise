// ABOUTME: Hook to drive dictionary-based spell checking in the TipTap editor
// ABOUTME: Extracts words from the document, checks them server-side, dispatches decorations

import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { textIssuePluginKey } from '@/components/editor/TextIssueExtension';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import {
  checkSpellingAction,
  getCustomDictionaryAction,
  addWordToCustomDictionaryAction,
  getIgnoredWordsAction,
  addIgnoredWordAction,
} from '@/app/actions/spell-check-actions';

// Word regex: letters and combining marks, at least 2 chars
const WORD_RE = /[\p{L}\p{M}]{2,}/gu;

function extractWordsFromDoc(
  editor: Editor
): Array<{ word: string; from: number; to: number }> {
  const result: Array<{ word: string; from: number; to: number }> = [];

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    WORD_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WORD_RE.exec(node.text)) !== null) {
      result.push({
        word: match[0],
        from: pos + match.index,
        to: pos + match.index + match[0].length,
      });
    }
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

    const wordsWithPositions = extractWordsFromDoc(ed);
    const uniqueWords = [...new Set(wordsWithPositions.map((w) => w.word))];

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

    const misspelledMap = new Map(
      misspelled.map((m) => [m.word.toLowerCase(), m.suggestions])
    );

    // Filter locally too — guards against stale server responses and test mocks
    const locallyAccepted = new Set([
      ...customDictionaryRef.current,
      ...ignoredWordsRef.current,
    ]);

    const spelling: TextIssue[] = wordsWithPositions
      .filter((w) => misspelledMap.has(w.word.toLowerCase()))
      .filter((w) => !locallyAccepted.has(w.word))
      .map((w) => ({
        nature: 'spelling',
        from: w.from,
        to: w.to,
        text: w.word,
        message: '',
        suggestions: misspelledMap.get(w.word.toLowerCase()) ?? [],
      }));

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
      // Persist per-project when possible
      if (projectId) {
        addIgnoredWordAction(projectId, word);
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
