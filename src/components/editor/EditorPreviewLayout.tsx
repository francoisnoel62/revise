// ABOUTME: Lays out the editor and its live publication preview side by side.
// ABOUTME: Toggling only hides the preview with CSS — it stays mounted so pagination keeps running.

'use client';

import { useState, type ReactNode } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const PREVIEW_VISIBILITY_STORAGE_KEY = 'revise:editor:preview-visible';

interface EditorPreviewLayoutProps {
  readonly editorSlot: ReactNode;
  readonly previewSlot: ReactNode;
}

export function EditorPreviewLayout({ editorSlot, previewSlot }: EditorPreviewLayoutProps) {
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(PREVIEW_VISIBILITY_STORAGE_KEY) !== 'hidden';
  });

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
          data-testid="editor-pane"
          className="min-w-0 bg-white rounded-lg shadow-lg overflow-hidden relative"
        >
          {editorSlot}
        </div>
        <aside
          className={cn(
            'min-w-0 overflow-hidden rounded-lg bg-slate-200 shadow-lg',
            !showPreview && 'hidden'
          )}
        >
          {previewSlot}
        </aside>
      </div>
    </div>
  );
}
