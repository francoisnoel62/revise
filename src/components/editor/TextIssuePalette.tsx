// ABOUTME: Inline palette for a located writing issue — opens on click of an underlined range.
// ABOUTME: Names the issue category in words, then offers suggestions and dictionary actions.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { textIssueCategory, type TextIssue } from '@/domain/value-objects/TextIssue';
import { textIssuePluginKey } from './TextIssueExtension';

interface TextIssuePaletteProps {
  editor: Editor | null;
  onIgnoreWord?: (word: string) => void;
  onAddToDictionary?: (word: string) => Promise<void>;
  /** Declines a grammar remark: the rule keeps working, this wording stops being raised. */
  onIgnoreGrammarIssue?: (issue: TextIssue) => Promise<void>;
}

interface PaletteState {
  visible: boolean;
  position: { top: number; left: number };
  issue: TextIssue | null;
  confirmation: 'none' | 'ignored' | 'added';
}

export function TextIssuePalette({
  editor,
  onIgnoreWord,
  onAddToDictionary,
  onIgnoreGrammarIssue,
}: TextIssuePaletteProps) {
  const [state, setState] = useState<PaletteState>({
    visible: false,
    position: { top: 0, left: 0 },
    issue: null,
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

  const findIssueAt = useCallback(
    (pos: number): TextIssue | null => {
      if (!editor) return null;
      const pluginState = textIssuePluginKey.getState(editor.state);
      if (!pluginState) return null;
      // A single arbitrated list, so the first match is the only candidate.
      return pluginState.issues.find((issue) => pos >= issue.from && pos <= issue.to) ?? null;
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

      const issue = findIssueAt(hit.pos);
      if (!issue) {
        setState((s) => ({ ...s, visible: false }));
        return;
      }

      setState({
        visible: true,
        position: { top: e.clientY + 8, left: e.clientX },
        issue,
        confirmation: 'none',
      });
    },
    [editor, findIssueAt]
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
      if (!editor || !state.issue) return;
      const { from, to } = state.issue;
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, suggestion).run();
      setState((s) => ({ ...s, visible: false }));
    },
    [editor, state.issue]
  );

  const handleIgnore = useCallback(async () => {
    if (!state.issue) return;
    // A misspelling is waved away by word; a grammar remark by rule and wording,
    // so the same word stays checked everywhere else.
    if (state.issue.nature === 'grammar') {
      await onIgnoreGrammarIssue?.(state.issue);
    } else {
      onIgnoreWord?.(state.issue.text);
    }
    showConfirmation('ignored');
  }, [state.issue, onIgnoreWord, onIgnoreGrammarIssue, showConfirmation]);

  const handleAddToDictionary = useCallback(async () => {
    if (!state.issue || !onAddToDictionary) return;
    await onAddToDictionary(state.issue.text);
    showConfirmation('added');
  }, [state.issue, onAddToDictionary, showConfirmation]);

  const handleClose = useCallback(() => {
    setState((s) => ({ ...s, visible: false, confirmation: 'none' }));
  }, []);

  if (!state.visible || !state.issue) return null;

  const { issue, position, confirmation } = state;

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

  const isMisspelling = issue.nature === 'spelling';
  const canIgnore = isMisspelling ? Boolean(onIgnoreWord) : Boolean(onIgnoreGrammarIssue);
  // The dictionary only makes sense for a single unknown word.
  const canAddToDictionary = isMisspelling && onAddToDictionary;

  return (
    <div
      ref={paletteRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 min-w-40 max-w-64 rounded-lg border bg-popover text-popover-foreground shadow-md p-2 text-sm"
    >
      <p className="text-xs text-muted-foreground mb-1.5 px-1">
        <span
          className={`mr-1.5 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            isMisspelling
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-600/10 text-green-700'
          }`}
        >
          {textIssueCategory(issue)}
        </span>
        <span className={isMisspelling ? 'line-through text-destructive' : 'line-through'}>
          {issue.text}
        </span>
        {' — Corrections :'}
      </p>

      {issue.message && (
        <p className="text-xs text-muted-foreground mb-1.5 px-1">{issue.message}</p>
      )}

      {issue.suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">Aucune suggestion</p>
      ) : (
        <ul className="space-y-0.5">
          {issue.suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                onClick={() => applyCorrection(suggestion)}
                className="w-full text-left rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t mt-2 pt-1.5 space-y-0.5">
        {canIgnore && (
          <button
            onClick={handleIgnore}
            className="w-full text-left rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Ignorer dans ce projet
          </button>
        )}
        {canAddToDictionary && (
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
