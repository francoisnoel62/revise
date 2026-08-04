// ABOUTME: Hook running "Corriger le chapitre" — the on-demand local grammar check.
// ABOUTME: Keeps only the ranges that still hold the text the engine flagged.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { textIssuePluginKey } from '@/components/editor/TextIssueExtension';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import { checkChapterGrammarAction } from '@/app/actions/grammar-actions';

/**
 * The engine reads the chapter as last saved. Comparing the flagged text with
 * what the range holds now rules out underlining — and later replacing — a range
 * that has moved since, whatever the reason.
 */
function stillHoldsFlaggedText(editor: Editor, issue: TextIssue): boolean {
  const doc = editor.state.doc;
  if (issue.from < 0 || issue.to > doc.content.size) return false;

  // Line breaks are counted by the engine and skipped by textBetween; ignore them
  // on both sides rather than pretend a break is a character.
  const withoutBreaks = (text: string) => text.replace(/\n/g, '');
  return withoutBreaks(doc.textBetween(issue.from, issue.to, '\n', '')) ===
    withoutBreaks(issue.text);
}

export function useGrammarCheck(
  editor: Editor | null,
  projectId?: string,
  chapterId?: string | null
): {
  checkChapter: () => Promise<void>;
  loading: boolean;
  status: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Underlines belong to the chapter they were computed for. A freshly mounted
  // editor holds none, so only an actual chapter switch has anything to clear.
  const checkedChapterIdRef = useRef(chapterId);
  useEffect(() => {
    if (checkedChapterIdRef.current === chapterId) return;
    checkedChapterIdRef.current = chapterId;

    setStatus(null);
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) return;
    ed.view.dispatch(ed.state.tr.setMeta(textIssuePluginKey, { grammar: [] }));
  }, [chapterId]);

  const checkChapter = useCallback(async () => {
    if (!editor || editor.isDestroyed || !projectId || !chapterId) return;

    setLoading(true);
    setStatus(null);
    try {
      const result = await checkChapterGrammarAction(projectId, chapterId);
      if (editor.isDestroyed) return;

      if (!result.success) {
        setStatus(result.error);
        return;
      }

      const grammar = result.data.filter((issue) => stillHoldsFlaggedText(editor, issue));
      editor.view.dispatch(editor.state.tr.setMeta(textIssuePluginKey, { grammar }));
      setStatus(
        grammar.length === 0
          ? 'Aucune faute de grammaire détectée dans ce chapitre.'
          : `${grammar.length} faute${grammar.length > 1 ? 's' : ''} soulignée${
              grammar.length > 1 ? 's' : ''
            } dans le chapitre.`
      );
    } finally {
      setLoading(false);
    }
  }, [editor, projectId, chapterId]);

  return { checkChapter, loading, status };
}
