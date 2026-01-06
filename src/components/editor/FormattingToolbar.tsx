// ABOUTME: Rich text formatting toolbar for TipTap editor
// ABOUTME: Provides buttons for bold, italic, underline, highlight with keyboard shortcuts

'use client';

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Highlighter } from 'lucide-react';

interface FormattingToolbarProps {
  editor: Editor | null;
}

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  if (!editor) return null;

  return (
    <div className="border-b border-slate-200 p-2 flex gap-1 bg-slate-50">
      <Button
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
        className="w-9 h-9"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        className="w-9 h-9"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
        className="w-9 h-9"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive('highlight') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={!editor.can().chain().focus().toggleHighlight().run()}
        title="Highlight (Ctrl+Shift+H)"
        className="w-9 h-9"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
    </div>
  );
}
