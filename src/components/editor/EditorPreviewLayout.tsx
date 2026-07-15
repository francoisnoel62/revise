// ABOUTME: Lays out the editor and its live publication preview side by side.
// ABOUTME: Toggling only hides the preview with CSS — it stays mounted so pagination keeps running.

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { computeAnchorBlockIndices, countWords } from '@/application/services/wordAnchors';

export const PREVIEW_VISIBILITY_STORAGE_KEY = 'revise:editor:preview-visible';
const WORDS_PER_SCROLL_SEGMENT = 1000;

/** Structural subset of TipTap's Editor needed to locate word-anchor positions on screen. */
export interface EditorAnchorSource {
  readonly state: {
    readonly doc: {
      forEach(callback: (node: { textContent: string }, offset: number) => void): void;
    };
  };
  readonly view: {
    coordsAtPos(pos: number): { top: number };
  };
}

/** A position within the editor's scroll range: which 1000-word segment, and how far into it. */
export interface EditorScrollPosition {
  readonly segmentIndex: number;
  readonly localRatio: number;
}

interface EditorPreviewLayoutProps {
  readonly editorSlot: ReactNode;
  readonly previewSlot: ReactNode;
  /** Called with the editor's scroll position (segment + local ratio) whenever it changes. */
  readonly onEditorScrollProgress?: (position: EditorScrollPosition) => void;
  /** Live editor instance, used to locate word-anchor boundaries for piecewise scroll sync. */
  readonly editor?: EditorAnchorSource | null;
}

export function EditorPreviewLayout({
  editorSlot,
  previewSlot,
  onEditorScrollProgress,
  editor,
}: EditorPreviewLayoutProps) {
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(PREVIEW_VISIBILITY_STORAGE_KEY) !== 'hidden';
  });
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper || !onEditorScrollProgress) return;

    let frame = 0;
    const computeProgress = () => {
      const rect = wrapper.getBoundingClientRect();
      const wrapperTop = window.scrollY + rect.top;
      const scrollableRange = rect.height - window.innerHeight;
      if (scrollableRange <= 0) {
        onEditorScrollProgress({ segmentIndex: 0, localRatio: 0 });
        return;
      }

      const pos = window.scrollY - wrapperTop;
      const anchorOffsets = editor
        ? computeEditorAnchorOffsets(editor, wrapperTop, window.scrollY, WORDS_PER_SCROLL_SEGMENT)
        : [];
      const boundaries = [0, ...anchorOffsets, scrollableRange];

      let segmentIndex = 0;
      for (let i = 0; i < boundaries.length - 1; i += 1) {
        if (pos >= boundaries[i]) segmentIndex = i;
      }
      const segmentStart = boundaries[segmentIndex];
      const segmentEnd = boundaries[segmentIndex + 1];
      const localRatio = segmentEnd > segmentStart ? (pos - segmentStart) / (segmentEnd - segmentStart) : 0;

      onEditorScrollProgress({ segmentIndex, localRatio: Math.min(1, Math.max(0, localRatio)) });
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(computeProgress);
    };

    computeProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    const resizeObserver = new window.ResizeObserver(computeProgress);
    resizeObserver.observe(wrapper);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
    };
  }, [onEditorScrollProgress, editor]);

  const toggle = () => {
    setShowPreview((previous) => {
      const next = !previous;
      window.localStorage.setItem(PREVIEW_VISIBILITY_STORAGE_KEY, next ? 'visible' : 'hidden');
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 px-2 md:px-4 pb-8">
      <div className="flex w-full max-w-400 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-pressed={showPreview}
          data-testid="preview-toggle-button"
          title={showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
        >
          {showPreview ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div
        data-testid="editor-preview-grid"
        className={cn('grid w-full max-w-400 gap-4', showPreview && 'xl:grid-cols-2')}
      >
        <div
          ref={editorWrapperRef}
          data-testid="editor-pane"
          className="min-w-0 bg-white rounded-lg shadow-lg overflow-hidden relative"
        >
          {editorSlot}
        </div>
        <aside
          className={cn(
            'min-w-0 overflow-hidden rounded-lg bg-slate-200 shadow-lg',
            'xl:sticky xl:top-46 xl:self-start xl:max-h-[calc(100vh-12.5rem)]',
            !showPreview && 'hidden'
          )}
        >
          {previewSlot}
        </aside>
      </div>
    </div>
  );
}

/**
 * Absolute page-Y offsets (comparable to `window.scrollY - wrapperTop`) of each 1000-word
 * boundary in the editor's document. Scroll-invariant: computed once per call regardless
 * of the current scroll position, since `(scrollY - wrapperTop) + coordsAtPos(pos).top` is
 * constant for a fixed `pos` as the page scrolls.
 */
function computeEditorAnchorOffsets(
  editor: EditorAnchorSource,
  wrapperTop: number,
  scrollY: number,
  everyNWords: number
): number[] {
  const blockWordCounts: number[] = [];
  const blockPositions: number[] = [];
  editor.state.doc.forEach((node, offset) => {
    blockWordCounts.push(countWords(node.textContent));
    blockPositions.push(offset);
  });

  const anchorBlockIndices = computeAnchorBlockIndices(blockWordCounts, everyNWords);
  return anchorBlockIndices.map((blockIndex) => {
    const top = editor.view.coordsAtPos(blockPositions[blockIndex] + 1).top;
    return scrollY - wrapperTop + top;
  });
}
