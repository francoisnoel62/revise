// ABOUTME: Search and replace bar component for the TipTap editor
// ABOUTME: Provides search, navigation, and replace functionality within the current chapter

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  ChevronUp,
  ChevronDown,
  Replace,
  ReplaceAll,
} from 'lucide-react';

interface SearchMatch {
  from: number;
  to: number;
}

interface SearchReplaceBarProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchReplaceBar({
  editor,
  isOpen,
  onClose,
}: SearchReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find all matches in the document
  const findMatches = useCallback(
    (term: string): SearchMatch[] => {
      if (!editor || !term) return [];

      const doc = editor.state.doc;
      const results: SearchMatch[] = [];
      const searchLower = term.toLowerCase();

      doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          const textLower = node.text.toLowerCase();
          let index = 0;
          while ((index = textLower.indexOf(searchLower, index)) !== -1) {
            results.push({
              from: pos + index,
              to: pos + index + term.length,
            });
            index += term.length;
          }
        }
      });

      return results;
    },
    [editor]
  );

  // Update matches when search term changes
  useEffect(() => {
    const newMatches = findMatches(searchTerm);
    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [searchTerm, findMatches]);

  // Highlight and scroll to current match
  useEffect(() => {
    if (!editor || matches.length === 0 || currentMatchIndex < 0) return;

    const match = matches[currentMatchIndex];
    if (match) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: match.from, to: match.to })
        .scrollIntoView()
        .run();
    }
  }, [editor, matches, currentMatchIndex]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
        editor?.commands.focus();
        return;
      }

      // Enter or F3 for next match
      if (e.key === 'Enter' || e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPreviousMatch();
        } else {
          goToNextMatch();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editor, matches, currentMatchIndex]);

  const goToNextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const goToPreviousMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const replaceCurrentMatch = () => {
    if (!editor || matches.length === 0 || currentMatchIndex < 0) return;

    const match = matches[currentMatchIndex];
    if (!match) return;

    editor
      .chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replaceTerm)
      .run();

    // Refresh matches after replacement
    setTimeout(() => {
      const newMatches = findMatches(searchTerm);
      setMatches(newMatches);
      if (newMatches.length === 0) {
        setCurrentMatchIndex(-1);
      } else if (currentMatchIndex >= newMatches.length) {
        setCurrentMatchIndex(newMatches.length - 1);
      }
    }, 10);
  };

  const replaceAllMatches = () => {
    if (!editor || matches.length === 0) return;

    // Replace from end to start to preserve positions
    const sortedMatches = [...matches].sort((a, b) => b.from - a.from);

    editor.chain().focus();

    for (const match of sortedMatches) {
      editor
        .chain()
        .setTextSelection({ from: match.from, to: match.to })
        .insertContent(replaceTerm)
        .run();
    }

    // Clear matches after replacing all
    setMatches([]);
    setCurrentMatchIndex(-1);
  };

  const handleClose = () => {
    setSearchTerm('');
    setReplaceTerm('');
    setMatches([]);
    setCurrentMatchIndex(-1);
    onClose();
    editor?.commands.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md p-3 flex flex-col gap-2">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <span className="text-xs text-slate-500 min-w-[60px] text-center">
          {matches.length > 0
            ? `${currentMatchIndex + 1}/${matches.length}`
            : searchTerm
              ? '0/0'
              : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMatch}
          disabled={matches.length === 0}
          title="Précédent (Shift+Enter)"
          className="h-8 w-8 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          title="Suivant (Enter)"
          className="h-8 w-8 p-0"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          title="Fermer (Esc)"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Replace row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Remplacer par..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={replaceCurrentMatch}
          disabled={matches.length === 0}
          title="Remplacer"
          className="h-8 px-2 text-xs gap-1"
        >
          <Replace className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Remplacer</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={replaceAllMatches}
          disabled={matches.length === 0}
          title="Tout remplacer"
          className="h-8 px-2 text-xs gap-1"
        >
          <ReplaceAll className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tout</span>
        </Button>
      </div>
    </div>
  );
}
