// ABOUTME: Inline palette for spell check corrections — shown on click of a red-underlined word
// ABOUTME: Offers dictionary suggestions; author chooses to apply or ignore each correction

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { spellCheckPluginKey, type SpellError } from './SpellCheckExtension';

interface SpellCheckPaletteProps {
  editor: Editor | null;
}

interface PaletteState {
  visible: boolean;
  position: { top: number; left: number };
  error: SpellError | null;
}

export function SpellCheckPalette({ editor }: SpellCheckPaletteProps) {
  const [state, setState] = useState<PaletteState>({
    visible: false,
    position: { top: 0, left: 0 },
    error: null,
  });

  const paletteRef = useRef<HTMLDivElement>(null);

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
      });
    },
    [editor, findErrorAt]
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (paletteRef.current && !paletteRef.current.contains(e.target as HTMLElement)) {
      setState((s) => ({ ...s, visible: false }));
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

  const ignoreCurrent = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  if (!state.visible || !state.error) return null;

  const { error, position } = state;

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

      <div className="border-t mt-2 pt-1.5">
        <button
          onClick={ignoreCurrent}
          className="w-full text-left rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}
