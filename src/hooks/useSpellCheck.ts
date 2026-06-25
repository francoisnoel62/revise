// ABOUTME: Hook to drive dictionary-based spell checking in the TipTap editor
// ABOUTME: Extracts words from the document, checks them server-side, dispatches decorations

import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { spellCheckPluginKey, type SpellError } from '@/components/editor/SpellCheckExtension';
import {
  checkSpellingAction,
  getCustomDictionaryAction,
  addWordToCustomDictionaryAction,
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
  const ignoredWordsRef = useRef<Set<string>>(new Set());
  const customDictionaryRef = useRef<string[]>([]);

  // Load per-project custom dictionary on mount / when projectId changes
  useEffect(() => {
    if (!projectId) return;
    getCustomDictionaryAction(projectId).then((words) => {
      customDictionaryRef.current = words;
      // Force re-check on next editor update
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
        ed.view.dispatch(ed.state.tr.setMeta(spellCheckPluginKey, { errors: [] }));
      }
      return;
    }

    const misspelled = await checkSpellingAction(uniqueWords, customDictionaryRef.current);
    if (ed.isDestroyed) return;

    const misspelledMap = new Map(
      misspelled.map((m) => [m.word.toLowerCase(), m.suggestions])
    );

    const errors: SpellError[] = wordsWithPositions
      .filter((w) => misspelledMap.has(w.word.toLowerCase()))
      .map((w) => ({
        ...w,
        suggestions: misspelledMap.get(w.word.toLowerCase()) ?? [],
      }))
      .filter((e) => !ignoredWordsRef.current.has(e.word));

    if (!ed.isDestroyed) {
      ed.view.dispatch(ed.state.tr.setMeta(spellCheckPluginKey, { errors }));
    }
  }, []);

  const ignoreWord = useCallback(
    (word: string) => {
      ignoredWordsRef.current.add(word);
      if (!editor || editor.isDestroyed) return;
      const pluginState = spellCheckPluginKey.getState(editor.state);
      if (!pluginState) return;
      const filteredErrors = pluginState.errors.filter(
        (e) => !ignoredWordsRef.current.has(e.word)
      );
      editor.view.dispatch(
        editor.state.tr.setMeta(spellCheckPluginKey, { errors: filteredErrors })
      );
    },
    [editor]
  );

  const addToDictionary = useCallback(
    async (word: string) => {
      if (!projectId) return;
      await addWordToCustomDictionaryAction(projectId, word);
      customDictionaryRef.current = [...customDictionaryRef.current, word];
      if (!editor || editor.isDestroyed) return;
      const pluginState = spellCheckPluginKey.getState(editor.state);
      if (!pluginState) return;
      const filteredErrors = pluginState.errors.filter((e) => e.word !== word);
      editor.view.dispatch(
        editor.state.tr.setMeta(spellCheckPluginKey, { errors: filteredErrors })
      );
      // Reset so next edit triggers a full re-check with the updated dictionary
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
