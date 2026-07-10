// ABOUTME: Lays out the editor and its live publication preview side by side.
// ABOUTME: Toggling only hides the preview with CSS — it stays mounted so pagination keeps running.

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const PREVIEW_VISIBILITY_STORAGE_KEY = 'revise:editor:preview-visible';

interface EditorPreviewLayoutProps {
  readonly editorSlot: ReactNode;
  readonly previewSlot: ReactNode;
  /** Called with the editor's scroll progress (0..1) whenever it changes. */
  readonly onEditorScrollProgress?: (progress: number) => void;
}

export function EditorPreviewLayout({
  editorSlot,
  previewSlot,
  onEditorScrollProgress,
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
        onEditorScrollProgress(0);
        return;
      }
      const progress = (window.scrollY - wrapperTop) / scrollableRange;
      onEditorScrollProgress(Math.min(1, Math.max(0, progress)));
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
  }, [onEditorScrollProgress]);

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
