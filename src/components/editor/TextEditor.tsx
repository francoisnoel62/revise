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
import { IndentHeading } from './extensions/IndentHeading';
import { Autocomplete } from './extensions/Autocomplete';
import { useEffect, useCallback } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { useProjectStore } from '@/store/projectStore';
import { generateCompletionAction } from '@/app/actions/completion-actions';

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
  projectId?: string;
  autocompleteEnabled?: boolean;
}

export function TextEditor({
  onSelectionChange,
  onEditorReady,
  placeholder = 'Commencez à écrire ou importez un document...',
  projectId,
  autocompleteEnabled = true,
}: TextEditorProps) {
  const { activeContent, updateActiveContent, project } = useProjectStore();

  // Handler for autocompletion requests
  const handleAutocomplete = useCallback(
    async (textBeforeCursor: string, textAfterCursor: string): Promise<string | null> => {
      const id = projectId || project?.id;
      if (!id) return null;

      try {
        const result = await generateCompletionAction(
          id,
          textBeforeCursor,
          textAfterCursor,
          project?.activeChapterId ?? undefined
        );
        if (result.success && result.data) {
          return result.data.completion;
        }
        return null;
      } catch {
        return null;
      }
    },
    [projectId, project?.id, project?.activeChapterId]
  );

  // Enable autosave
  useAutosave();

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false, // Performance optimization
    extensions: [
      StarterKit.configure({
        // StarterKit v3 includes bold, italic, and underline by default
        paragraph: false, // Disable default paragraph - use our custom IndentParagraph
        heading: false, // Disable default heading - use our custom IndentHeading
      }),
      IndentParagraph, // Custom paragraph with indent support
      IndentHeading.configure({ levels: [1, 2, 3, 4, 5, 6] }), // Custom heading with indent support
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
      Autocomplete.configure({
        enabled: autocompleteEnabled,
        onComplete: handleAutocomplete,
        projectId: projectId || project?.id,
        chapterId: project?.activeChapterId ?? undefined,
        useStreaming: true,
      }),
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
        spellcheck: 'false',
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

  // Update autocomplete extension when enabled state changes
  useEffect(() => {
    if (!editor) return;

    // Use the command to update autocomplete enabled state
    editor.commands.setAutocompleteEnabled(autocompleteEnabled);
  }, [editor, autocompleteEnabled]);

  // Keep autocomplete aware of the current chapter (for chapter-linked research context)
  useEffect(() => {
    if (!editor) return;
    editor.commands.setAutocompleteChapterId(project?.activeChapterId ?? undefined);
  }, [editor, project?.activeChapterId]);

  if (!editor) return null;

  return (
    <div className="w-full bg-slate-50">
      <EditorContent editor={editor} />
    </div>
  );
}
