// ABOUTME: Inline palette for spell check corrections — shown on click of a red-underlined word
// ABOUTME: Three actions: apply suggestion, ignore in project (persistent), add to dictionary (persistent)

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { spellCheckPluginKey, type SpellError } from './SpellCheckExtension';

interface SpellCheckPaletteProps {
  editor: Editor | null;
  onIgnoreWord?: (word: string) => void;
  onAddToDictionary?: (word: string) => Promise<void>;
}

interface PaletteState {
  visible: boolean;
  position: { top: number; left: number };
  error: SpellError | null;
  confirmation: 'none' | 'ignored' | 'added';
}

export function SpellCheckPalette({ editor, onIgnoreWord, onAddToDictionary }: SpellCheckPaletteProps) {
  const [state, setState] = useState<PaletteState>({
    visible: false,
    position: { top: 0, left: 0 },
    error: null,
    confirmation: 'none',
  });

  const paletteRef = useRef<HTMLDivElement>(null);
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showConfirmation = useCallback((type: 'ignored' | 'added') => {
    if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    setState((s) => ({ ...s, confirmation: type }));
    confirmationTimerRef.current = setTimeout(() => {
      setState((s) => ({ ...s, visible: false, confirmation: 'none' }));
    }, 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    };
  }, []);

  const findErrorAt = useCallback(
    (pos: number): SpellError | null => {
      if (!editor) return null;
      const pluginState = spellCheckPluginKey.getState(editor.state);
      if (!pluginState) return null;
      return (
        pluginState.errors.find((e) => pos >= e.from && pos <= e.to) ?? null
      );
    },
    [editor]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!editor) return;

      const view = (
        editor as unknown as {
          view: { posAtCoords: (c: { left: number; top: number }) => { pos: number } | null };
        }
      ).view;

      const hit = view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!hit) {
        setState((s) => ({ ...s, visible: false }));
        return;
      }

      const error = findErrorAt(hit.pos);
      if (!error) {
        setState((s) => ({ ...s, visible: false }));
        return;
      }

      setState({
        visible: true,
        position: { top: e.clientY + 8, left: e.clientX },
        error,
        confirmation: 'none',
      });
    },
    [editor, findErrorAt]
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (paletteRef.current && !paletteRef.current.contains(e.target as HTMLElement)) {
      setState((s) => ({ ...s, visible: false, confirmation: 'none' }));
    }
  }, []);

  useEffect(() => {
    if (!editor) return;
    const editorEl = editor.view.dom;
    editorEl.addEventListener('click', handleClick);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      editorEl.removeEventListener('click', handleClick);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editor, handleClick, handleClickOutside]);

  const applyCorrection = useCallback(
    (suggestion: string) => {
      if (!editor || !state.error) return;
      const { from, to } = state.error;
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, suggestion).run();
      setState((s) => ({ ...s, visible: false }));
    },
    [editor, state.error]
  );

  const handleIgnore = useCallback(() => {
    if (!state.error) return;
    onIgnoreWord?.(state.error.word);
    showConfirmation('ignored');
  }, [state.error, onIgnoreWord, showConfirmation]);

  const handleAddToDictionary = useCallback(async () => {
    if (!state.error || !onAddToDictionary) return;
    await onAddToDictionary(state.error.word);
    showConfirmation('added');
  }, [state.error, onAddToDictionary, showConfirmation]);

  const handleClose = useCallback(() => {
    setState((s) => ({ ...s, visible: false, confirmation: 'none' }));
  }, []);

  if (!state.visible || !state.error) return null;

  const { error, position, confirmation } = state;

  // Inline confirmation — auto-dismisses after 1.2s
  if (confirmation !== 'none') {
    return (
      <div
        ref={paletteRef}
        style={{ top: position.top, left: position.left }}
        className="fixed z-50 min-w-40 rounded-lg border bg-popover text-popover-foreground shadow-md p-3 text-sm"
      >
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-green-600">✓</span>
          {confirmation === 'ignored' ? 'Ignoré dans ce projet' : 'Ajouté au dictionnaire'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={paletteRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 min-w-40 max-w-64 rounded-lg border bg-popover text-popover-foreground shadow-md p-2 text-sm"
    >
      <p className="text-xs text-muted-foreground mb-1.5 px-1">
        <span className="line-through text-destructive">{error.word}</span>
        {' — Corrections :'}
      </p>

      {error.suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">Aucune suggestion</p>
      ) : (
        <ul className="space-y-0.5">
          {error.suggestions.map((s) => (
            <li key={s}>
              <button
                onClick={() => applyCorrection(s)}
                className="w-full text-left rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t mt-2 pt-1.5 space-y-0.5">
        {onIgnoreWord && (
          <button
            onClick={handleIgnore}
            className="w-full text-left rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Ignorer dans ce projet
          </button>
        )}
        {onAddToDictionary && (
          <button
            onClick={handleAddToDictionary}
            className="w-full text-left rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Ajouter au dictionnaire
          </button>
        )}
        <button
          onClick={handleClose}
          className="w-full text-left rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
