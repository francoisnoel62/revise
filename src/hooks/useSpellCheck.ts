// ABOUTME: Hook to drive dictionary-based spell checking in the TipTap editor
// ABOUTME: Extracts words from the document, checks them server-side, dispatches decorations

import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { spellCheckPluginKey, type SpellError } from '@/components/editor/SpellCheckExtension';
import { checkSpellingAction } from '@/app/actions/spell-check-actions';

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

export function useSpellCheck(editor: Editor | null) {
  const lastTextRef = useRef<string>('');

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

    const misspelled = await checkSpellingAction(uniqueWords);
    if (ed.isDestroyed) return;

    const misspelledMap = new Map(
      misspelled.map((m) => [m.word.toLowerCase(), m.suggestions])
    );

    const errors: SpellError[] = wordsWithPositions
      .filter((w) => misspelledMap.has(w.word.toLowerCase()))
      .map((w) => ({
        ...w,
        suggestions: misspelledMap.get(w.word.toLowerCase()) ?? [],
      }));

    if (!ed.isDestroyed) {
      ed.view.dispatch(ed.state.tr.setMeta(spellCheckPluginKey, { errors }));
    }
  }, []);

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
}
