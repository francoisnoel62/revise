// ABOUTME: Core TipTap editor component for text editing with selection tracking
// ABOUTME: Provides rich text editing interface with undo/redo and selection detection

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface TextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange: (from: number, to: number) => void;
  placeholder?: string;
}

export function TextEditor({
  content,
  onContentChange,
  onSelectionChange,
  placeholder = 'Commencez à écrire ou importez un document...',
}: TextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onContentChange(text);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      onSelectionChange(from, to);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] p-8',
      },
    },
  });

  // Update editor content when prop changes (e.g., after import)
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full border border-slate-200 rounded-lg bg-white">
      <EditorContent editor={editor} />
    </div>
  );
}
