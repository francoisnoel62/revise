// ABOUTME: Inline bubble palette for the contextual thesaurus — two-layer word suggestions
// ABOUTME: Layer 1 is instant (lexical); layer 2 is AI-powered and triggered on demand

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import { Badge } from '@/components/ui/badge';
import {
  getLexicalAlternativesAction,
  getAIAlternativesAction,
} from '@/app/actions/thesaurus-actions';
import type { WordAlternativeDTO } from '@/app/actions/thesaurus-actions';

interface ThesaurusPaletteProps {
  editor: Editor | null;
  projectId: string;
  showAILayer: boolean;
}

export function ThesaurusPalette({ editor, projectId, showAILayer }: ThesaurusPaletteProps) {
  const [layer1, setLayer1] = useState<string[]>([]);
  const [layer2, setLayer2] = useState<WordAlternativeDTO[]>([]);
  const [layer1Loading, setLayer1Loading] = useState(false);
  const [layer2Loading, setLayer2Loading] = useState(false);
  const [voiceAnchored, setVoiceAnchored] = useState(false);
  const [showAIResults, setShowAIResults] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Capture the selection at display time to protect against drift when buttons are clicked
  const capturedRef = useRef<{ from: number; to: number; word: string; sentence: string } | null>(null);
  // Track last loaded word to avoid refetching on same word
  const lastLoadedWordRef = useRef<string>('');
  const paletteRef = useRef<HTMLDivElement>(null);

  const triggerLayer1 = useCallback(
    async (word: string) => {
      setLayer1Loading(true);
      setLayer1([]);
      try {
        const result = await getLexicalAlternativesAction(projectId, word);
        if (result.success) {
          setLayer1(result.data.layer1.slice(0, 10));
        }
      } finally {
        setLayer1Loading(false);
      }
    },
    [projectId]
  );

  // Inspect the editor state, capture the selection and trigger layer1 if it's a new single word.
  // Returns true when the palette should be visible, false otherwise.
  const detectAndCapture = useCallback(
    (e: Editor): boolean => {
      const { from, to } = e.state.selection;
      if (to <= from) return false;

      const text = e.state.doc.textBetween(from, to).trim();
      if (text.includes(' ') || text.length < 2) return false;

      if (text !== lastLoadedWordRef.current) {
        let sentence = text;
        try {
          // $from is a ProseMirror ResolvedPos giving paragraph boundaries
          const { $from } = e.state.selection as unknown as {
            $from: { start: () => number; end: () => number };
          };
          sentence = e.state.doc.textBetween($from.start(), $from.end());
        } catch {
          // $from unavailable (e.g. in tests) — use selected text as fallback
        }

        capturedRef.current = { from, to, word: text, sentence };
        lastLoadedWordRef.current = text;
        setShowAIResults(false);
        setLayer2([]);
        triggerLayer1(text);
      }

      // Compute screen position for the overlay
      try {
        const view = (e as unknown as { view: { coordsAtPos: (pos: number) => { top: number; left: number } } }).view;
        const coords = view.coordsAtPos(from);
        setPosition({ top: coords.top, left: coords.left });
      } catch {
        // DOM/view unavailable (tests) — keep default position
      }

      return true;
    },
    [triggerLayer1]
  );

  // Initial detection on editor mount — handles tests where editor.on is not wired
  useEffect(() => {
    if (!editor) return;
    const shouldShow = detectAndCapture(editor);
    if (shouldShow) setVisible(true);
  }, [editor, detectAndCapture]);

  // Subscribe to selection changes for real-time detection in production
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const shouldShow = detectAndCapture(editor);
      setVisible(shouldShow);
      if (!shouldShow) lastLoadedWordRef.current = '';
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => { editor.off('selectionUpdate', handleSelectionUpdate); };
  }, [editor, detectAndCapture]);

  // Close on click outside the palette
  useEffect(() => {
    const handleMouseDown = (e: globalThis.MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as globalThis.Node)) {
        setVisible(false);
        lastLoadedWordRef.current = '';
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        lastLoadedWordRef.current = '';
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGoFurther = useCallback(async () => {
    if (!capturedRef.current) return;
    const { word, sentence } = capturedRef.current;
    setLayer2Loading(true);
    setShowAIResults(true);
    try {
      const result = await getAIAlternativesAction(projectId, word, sentence);
      if (result.success) {
        setLayer2(result.data.layer2);
        setVoiceAnchored(result.data.voiceAnchored);
      }
    } finally {
      setLayer2Loading(false);
    }
  }, [projectId]);

  const handleInsert = useCallback(
    (word: string) => {
      if (!editor || !capturedRef.current) return;
      const { from, to } = capturedRef.current;

      editor.chain().focus().setTextSelection({ from, to }).insertContent(word).run();

      const newTo = from + word.length;
      editor
        .chain()
        .setTextSelection({ from, to: newTo })
        .setHighlight({ color: '#fef08a' })
        .run();

      setTimeout(() => {
        editor
          .chain()
          .setTextSelection({ from, to: newTo })
          .unsetHighlight()
          .run();
      }, 3000);

      setVisible(false);
      lastLoadedWordRef.current = '';
      capturedRef.current = null;
    },
    [editor]
  );

  if (!editor || !visible) return null;

  return (
    <div
      ref={paletteRef}
      style={{
        position: 'fixed',
        top: Math.max(8, position.top - 260),
        left: Math.max(8, position.left),
        zIndex: 50,
      }}
      className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-72 max-w-80"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">Synonymes</span>
        {voiceAnchored && showAIResults && (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Accordé à ta voix
          </Badge>
        )}
      </div>

      {/* Layer 1 — lexical synonyms */}
      {layer1Loading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-xs text-slate-400">Chargement…</span>
        </div>
      ) : layer1.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-1">Aucun synonyme trouvé</p>
      ) : (
        <div className="flex flex-wrap gap-1 mb-2">
          {layer1.map((word) => (
            <button
              key={word}
              onClick={() => handleInsert(word)}
              className="px-2 py-0.5 text-sm bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors cursor-pointer"
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {/* Layer 2 — AI alternatives (when requested) */}
      {showAIResults && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          {layer2Loading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-xs text-slate-400">IA en cours…</span>
            </div>
          ) : (
            <div className="space-y-2">
              {layer2.map((alt) => (
                <div
                  key={alt.word}
                  className="group flex items-start gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleInsert(alt.word)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-900">{alt.word}</span>
                    {alt.register && (
                      <span className="ml-1.5 text-xs text-slate-400 italic">{alt.register}</span>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{alt.sceneEffect}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* "Aller plus loin" — only when AI available and layer2 not yet shown */}
      {showAILayer && !showAIResults && !layer1Loading && (
        <button
          onClick={handleGoFurther}
          disabled={layer2Loading}
          className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 py-1 border-t border-slate-100 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <span>✦</span>
          <span>Aller plus loin</span>
        </button>
      )}
    </div>
  );
}
