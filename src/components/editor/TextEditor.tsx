// ABOUTME: Enhanced TipTap editor with rich text formatting support
// ABOUTME: Stores content as TipTap JSON for formatting preservation

'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { IndentParagraph } from './extensions/IndentParagraph';
import { useEffect } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { useProjectStore } from '@/store/projectStore';

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
  onSelectionChange: (from: number, to: number) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
}

export function TextEditor({
  onSelectionChange,
  onEditorReady,
  placeholder = 'Commencez à écrire ou importez un document...',
}: TextEditorProps) {
  const { activeContent, updateActiveContent, project } = useProjectStore();

  // Enable autosave
  useAutosave();

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false, // Performance optimization
    extensions: [
      StarterKit.configure({
        // StarterKit v3 includes bold, italic, and underline by default
        paragraph: false, // Disable default paragraph - use our custom IndentParagraph
      }),
      IndentParagraph, // Custom paragraph with indent support
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
      CharacterCount,
    ],
    content: activeContent ? JSON.parse(activeContent) : { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      updateActiveContent(JSON.stringify(json));
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

  // Update editor when active chapter changes
  useEffect(() => {
    if (!editor) return;

    const currentJson = JSON.stringify(editor.getJSON());
    if (activeContent !== currentJson) {
      const newContent = activeContent ? JSON.parse(activeContent) : { type: 'doc', content: [] };
      editor.commands.setContent(newContent, {
        emitUpdate: false, // Don't trigger update event during switch
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, project?.activeChapterId]); // Trigger on activeChapterId change

  if (!editor) return null;

  return (
    <div className="w-full bg-slate-50">
      <EditorContent editor={editor} />
    </div>
  );
}
