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
import { Autocomplete, AutocompleteStorage } from './extensions/Autocomplete';
import { AutocompleteDot, AutocompleteDotState } from './AutocompleteDot';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { useProjectStore } from '@/store/projectStore';
import { generateCompletionAction } from '@/app/actions/completion-actions';
import { sendAutocompleteEvent } from '@/lib/autocompleteTelemetryClient';
import type { AutocompletePreferences } from '@/domain/value-objects/AutocompletePreferences';

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
  autocompletePreferences?: AutocompletePreferences;
}

export function TextEditor({
  onSelectionChange,
  onEditorReady,
  placeholder = 'Commencez à écrire ou importez un document...',
  projectId,
  autocompleteEnabled = true,
  autocompletePreferences,
}: TextEditorProps) {
  const { activeContent, updateActiveContent, project } = useProjectStore();

  // Dot state: bridges the ProseMirror plugin state to React
  const [dotState, setDotState] = useState<AutocompleteDotState>('idle');
  const dotStateRef = useRef<AutocompleteDotState>('idle');
  const dotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        telemetryEnabled: true,
        onEvent: autocompletePreferences?.learnFromRejections !== false ? sendAutocompleteEvent : undefined,
        suggestionLength: autocompletePreferences?.suggestionLength,
        audace: autocompletePreferences?.audace,
        partialAcceptance: autocompletePreferences?.partialAcceptance ?? true,
        smartPrefetch: autocompletePreferences?.smartPrefetch ?? true,
      }),
    ],
    content: activeContent ? JSON.parse(activeContent) : { type: 'doc', content: [] },
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON();
      updateActiveContent(JSON.stringify(json));
    },
    onSelectionUpdate: ({ editor: e }) => {
      const { from, to } = e.state.selection;
      onSelectionChange(from, to);
    },
    onTransaction: ({ editor: e }) => {
      // Bridge autocomplete storage state to React for the dot indicator.
      // Debounced to avoid excessive re-renders; only fires when state actually changes.
      // Cast needed because editor.storage conflicts with the DOM Storage type name.
      const storage = (e.storage as unknown as Record<string, unknown>)['autocomplete'] as AutocompleteStorage | undefined;
      if (!storage) return;

      const next: AutocompleteDotState =
        storage.runState === 'prefetching'
          ? 'prefetching'
          : storage.runState === 'ready'
            ? 'ready'
            : storage.runState === 'visible' || storage.suggestion || storage.isLoading
              ? 'visible'
              : storage.runState === 'waiting'
                ? 'waiting'
                : 'idle';

      if (next !== dotStateRef.current) {
        dotStateRef.current = next;
        if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
        dotTimerRef.current = setTimeout(() => setDotState(next), 50);
      }
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
    editor.commands.setAutocompleteRuntimeOptions({
      enabled: autocompleteEnabled,
      projectId: projectId || project?.id,
      chapterId: project?.activeChapterId ?? undefined,
      suggestionLength: autocompletePreferences?.suggestionLength,
      audace: autocompletePreferences?.audace,
      partialAcceptance: autocompletePreferences?.partialAcceptance ?? true,
      smartPrefetch: autocompletePreferences?.smartPrefetch ?? true,
      onEvent: autocompletePreferences?.learnFromRejections !== false ? sendAutocompleteEvent : undefined,
    });
  }, [
    editor,
    autocompleteEnabled,
    projectId,
    project?.id,
    project?.activeChapterId,
    autocompletePreferences,
  ]);

  // Keep autocomplete aware of the current chapter (for chapter-linked research context)
  useEffect(() => {
    if (!editor) return;
    editor.commands.setAutocompleteChapterId(project?.activeChapterId ?? undefined);
  }, [editor, project?.activeChapterId]);

  // Clean up dot debounce timer on unmount
  useEffect(() => {
    return () => {
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="w-full bg-slate-50 relative">
      <AutocompleteDot state={dotState} />
      <EditorContent editor={editor} />
    </div>
  );
}
