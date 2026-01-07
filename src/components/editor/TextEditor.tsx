// ABOUTME: Enhanced TipTap editor with rich text formatting support
// ABOUTME: Stores content as TipTap JSON for formatting preservation

'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import TextAlign from '@tiptap/extension-text-align';
import { IndentParagraph } from './extensions/IndentParagraph';
import { useEffect } from 'react';

// Custom extension for em dash insertion with Ctrl+K
const EmDashExtension = Extension.create({
  name: 'emDash',

  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        this.editor.commands.insertContent('—');
        return true;
      },
    };
  },
});

interface TextEditorProps {
  content: string; // TipTap JSON stringified
  onContentChange: (content: string) => void;
  onSelectionChange: (from: number, to: number) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
}

export function TextEditor({
  content,
  onContentChange,
  onSelectionChange,
  onEditorReady,
  placeholder = 'Commencez à écrire ou importez un document...',
}: TextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false, // Performance optimization
    extensions: [
      StarterKit.configure({
        // StarterKit includes bold and italic by default, but not underline or highlight
        paragraph: false, // Disable default paragraph - use our custom IndentParagraph
      }),
      IndentParagraph, // Custom paragraph with indent support
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle, // Required for FontFamily and FontSize
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'justify',
      }),
      EmDashExtension,
      Placeholder.configure({ placeholder }),
    ],
    content: content ? JSON.parse(content) : { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onContentChange(JSON.stringify(json));
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      onSelectionChange(from, to);
    },
    editorProps: {
      attributes: {
        class: 'editor-a4-page focus:outline-none tiptap',
      },
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update editor when content changes externally (e.g., chapter switch)
  useEffect(() => {
    if (!editor) return;

    const currentJson = JSON.stringify(editor.getJSON());
    if (content !== currentJson) {
      const newContent = content ? JSON.parse(content) : { type: 'doc', content: [] };
      editor.commands.setContent(newContent, {
        emitUpdate: false, // Don't trigger update event during switch
      });
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="w-full bg-slate-50">
      <EditorContent editor={editor} />
    </div>
  );
}
