// ABOUTME: Displays character and word count statistics from TipTap editor
// ABOUTME: Uses TipTap CharacterCount extension to get accurate counts

'use client';

import { Editor } from '@tiptap/react';

interface CharacterCounterProps {
  editor: Editor | null;
}

export function CharacterCounter({ editor }: CharacterCounterProps) {
  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{characterCount.toLocaleString('fr-FR')} caractères</span>
      <span className="text-slate-300">|</span>
      <span>{wordCount.toLocaleString('fr-FR')} mots</span>
    </div>
  );
}
