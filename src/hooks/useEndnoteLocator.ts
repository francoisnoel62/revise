// ABOUTME: Resolves an endnotes-panel action (chapter, rank) to a document position, switching
// ABOUTME: chapters first if needed and waiting for the editor's real re-seed before acting.

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { findEndnoteRefByRank, type EndnoteContent } from '@/components/editor/extensions/EndnoteRef';

type EndnoteAction = 'edit' | 'delete';

interface PendingLocate {
  chapterId: string;
  rank: number;
  action: EndnoteAction;
}

export interface UseEndnoteLocatorOptions {
  editor: Editor | null;
  activeChapterId: string | null;
  /** The chapter id TextEditor last announced as fully re-seeded (see onChapterDocumentReady). */
  readyChapterId: string | null;
  /** Switches the active chapter and reports whether it actually succeeded. */
  switchToChapter: (chapterId: string) => Promise<boolean>;
  onEdit: (pos: number, content: EndnoteContent | null) => void;
  onDelete: (pos: number, content: EndnoteContent | null) => void;
}

export interface UseEndnoteLocatorResult {
  /** Resolve a note's (chapter, rank) address and dispatch the requested action to it. */
  locateEndnote: (chapterId: string, rank: number, action: EndnoteAction) => Promise<void>;
  /** True while waiting on a chapter switch to complete and its document to be re-seeded. */
  isLocating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useEndnoteLocator({
  editor,
  activeChapterId,
  readyChapterId,
  switchToChapter,
  onEdit,
  onDelete,
}: UseEndnoteLocatorOptions): UseEndnoteLocatorResult {
  const [pending, setPending] = useState<PendingLocate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Shared by the synchronous (active-chapter) path and the post-handshake effect below:
  // resolve a rank against a live document and either dispatch or surface a not-found error.
  const resolveAndDispatch = (doc: Editor['state']['doc'], rank: number, action: EndnoteAction) => {
    const found = findEndnoteRefByRank(doc, rank);
    if (!found) {
      setError(`Note ${rank} introuvable dans ce chapitre.`);
      return;
    }
    if (action === 'edit') onEdit(found.pos, found.content);
    else onDelete(found.pos, found.content);
  };

  const locateEndnote = async (chapterId: string, rank: number, action: EndnoteAction) => {
    if (!editor) return;

    if (chapterId === activeChapterId) {
      resolveAndDispatch(editor.state.doc, rank, action);
      return;
    }

    setPending({ chapterId, rank, action });
    const switched = await switchToChapter(chapterId);
    if (!switched) {
      setPending(null);
      setError('Le changement de chapitre a échoué.');
      return;
    }
    // Resolve nothing here: the store may already report chapterId as active while the
    // ProseMirror document still holds the previous chapter's content. Resolution happens
    // below, only once TextEditor announces readyChapterId === chapterId.
  };

  useEffect(() => {
    if (!pending || !editor) return;
    if (readyChapterId !== pending.chapterId) return;

    const { rank, action } = pending;
    setPending(null);
    resolveAndDispatch(editor.state.doc, rank, action);
    // resolveAndDispatch reads onEdit/onDelete/setError each render but isn't itself a
    // dependency — only these three values should re-trigger resolution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, readyChapterId, editor]);

  return {
    locateEndnote,
    isLocating: pending !== null,
    error,
    clearError: () => setError(null),
  };
}
