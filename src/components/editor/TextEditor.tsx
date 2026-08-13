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
import { IndentParagraph } from '@/adapters/tiptap/IndentParagraph';
import { IndentHeading } from '@/adapters/tiptap/IndentHeading';
import { EndnoteRef, type EndnoteContent } from './extensions/EndnoteRef';
import { Autocomplete, AutocompleteStorage } from './extensions/Autocomplete';
import { AutocompleteDot, AutocompleteDotState } from './AutocompleteDot';
import { TextIssueExtension } from './TextIssueExtension';
import { documentMatchesContent } from './documentMatchesContent';
import { TextIssuePalette } from './TextIssuePalette';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import { useGrammarIssueDecline } from '@/hooks/useGrammarIssueDecline';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAutosave } from '@/hooks/useAutosave';
import { useAutomaticSnapshots } from '@/hooks/useAutomaticSnapshots';
import { useSemanticMigration } from '@/hooks/useSemanticMigration';
import { useProjectStore } from '@/store/projectStore';
import { generateCompletionAction } from '@/app/actions/completion-actions';
import { sendAutocompleteEvent } from '@/lib/autocompleteTelemetryClient';
import { SemanticAmbiguityBanner } from './SemanticAmbiguityBanner';
import type { AutocompletePreferences } from '@/domain/value-objects/AutocompletePreferences';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import { switchPublicationProfile } from '@/application/rendering/PublicationProfileSwitch';
import { stripToSemantic } from '@/application/rendering/PresentationOverrideService';

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

const EMPTY_PRESENTATION_OVERRIDES: PresentationOverrideLayer = [];

interface TextEditorProps {
  onSelectionChange: (from: number, to: number) => void;
  onEditorReady?: (editor: Editor) => void;
  placeholder?: string;
  projectId?: string;
  autocompleteEnabled?: boolean;
  autocompletePreferences?: AutocompletePreferences;
  publicationProfileId?: PublicationProfileId;
  presentationOverrides?: PresentationOverrideLayer;
  onPresentationOverridesChange?: (overrides: PresentationOverrideLayer) => void;
  /** Ctrl+Alt+N — the host opens the endnote insertion modal. */
  onEndnoteInsertRequest?: () => void;
  /** An existing endnote call was clicked — the host reopens the modal to edit it. */
  onEndnoteEditRequest?: (pos: number, content: EndnoteContent | null) => void;
  /** A non-empty endnote is about to be deleted — the host confirms first. */
  onEndnoteDeleteRequest?: (pos: number, content: EndnoteContent | null) => void;
  /**
   * Fired at the end of the chapter-switch effect, after the document has actually been
   * re-seeded (or confirmed already correct) — never before. The endnotes panel's locator
   * waits for this exact signal before resolving a note's rank against the live document,
   * so resolving it any earlier risks acting on the previous chapter.
   */
  onChapterDocumentReady?: (chapterId: string) => void;
}

export function TextEditor({
  onSelectionChange,
  onEditorReady,
  placeholder = 'Commencez à écrire ou importez un document...',
  projectId,
  autocompleteEnabled = true,
  autocompletePreferences,
  publicationProfileId = 'kdp-6x9',
  presentationOverrides = EMPTY_PRESENTATION_OVERRIDES,
  onPresentationOverridesChange,
  onEndnoteInsertRequest,
  onEndnoteEditRequest,
  onEndnoteDeleteRequest,
  onChapterDocumentReady,
}: TextEditorProps) {
  const { activeContent, updateActiveContent, project } = useProjectStore();

  // Read through a ref so a change of callback identity never re-triggers the seed effect below.
  const onChapterDocumentReadyRef = useRef(onChapterDocumentReady);
  onChapterDocumentReadyRef.current = onChapterDocumentReady;

  // Endnote callbacks are read through a ref so the editor's one-time extension
  // config always calls the latest handlers without re-creating the editor.
  const endnoteCallbacksRef = useRef({
    onInsert: onEndnoteInsertRequest,
    onEdit: onEndnoteEditRequest,
    onDelete: onEndnoteDeleteRequest,
  });
  endnoteCallbacksRef.current = {
    onInsert: onEndnoteInsertRequest,
    onEdit: onEndnoteEditRequest,
    onDelete: onEndnoteDeleteRequest,
  };

  // Dot state: bridges the ProseMirror plugin state to React
  const [dotState, setDotState] = useState<AutocompleteDotState>('idle');
  const dotStateRef = useRef<AutocompleteDotState>('idle');
  const dotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publicationProfileRef = useRef(publicationProfileId);
  const presentationOverridesRef = useRef(presentationOverrides);
  const onPresentationOverridesChangeRef = useRef(onPresentationOverridesChange);
  // An autosave echoes the active content back through project.updatedAt. Keep the last
  // editor-originated value so that echo cannot replace the live ProseMirror document and
  // move its selection to another position.
  const lastEditorContentRef = useRef<string | null>(null);
  const lastSeededChapterIdRef = useRef<string | null>(null);
  const lastPresentationSignatureRef = useRef<string | null>(null);
  publicationProfileRef.current = publicationProfileId;
  presentationOverridesRef.current = presentationOverrides;
  onPresentationOverridesChangeRef.current = onPresentationOverridesChange;

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
  const automaticSnapshotError = useAutomaticSnapshots(projectId || project?.id);

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
      EndnoteRef.configure({
        onTrigger: () => endnoteCallbacksRef.current.onInsert?.(),
        onActivate: (pos, content) => endnoteCallbacksRef.current.onEdit?.(pos, content),
        onDeleteRequest: (pos, content) => endnoteCallbacksRef.current.onDelete?.(pos, content),
      }),
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
      TextIssueExtension,
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
      const content = e.getJSON() as ContentNode;
      if (publicationProfileRef.current === 'passerelle') {
        const switched = switchPublicationProfile(
          content,
          'passerelle',
          presentationOverridesRef.current
        );
        const semanticContent = JSON.stringify(stripToSemantic(content));
        lastEditorContentRef.current = semanticContent;
        updateActiveContent(semanticContent);
        if (
          JSON.stringify(switched.overrides) !==
          JSON.stringify(presentationOverridesRef.current)
        ) {
          onPresentationOverridesChangeRef.current?.(switched.overrides);
        }
        return;
      }
      const serializedContent = JSON.stringify(content);
      lastEditorContentRef.current = serializedContent;
      updateActiveContent(serializedContent);
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

  // Update editor when the active chapter changes, or when its content was
  // replaced from outside the editor (e.g. a snapshot restore) — project.updatedAt
  // moves on both a chapter switch and an external replacement, but NOT on the
  // editor's own keystroke-driven updateActiveContent calls, so this can't fight
  // normal typing: the comparison below is a no-op whenever activeContent already
  // matches what the editor itself just produced.
  useEffect(() => {
    if (!editor) return;

    const activeChapterId = project?.activeChapterId ?? null;
    const presentationSignature = `${publicationProfileId}:${JSON.stringify(presentationOverrides)}`;
    const isAutosaveEcho =
      activeChapterId === lastSeededChapterIdRef.current &&
      activeContent === lastEditorContentRef.current &&
      presentationSignature === lastPresentationSignatureRef.current;

    if (isAutosaveEcho) {
      if (activeChapterId) {
        onChapterDocumentReadyRef.current?.(activeChapterId);
      }
      return;
    }

    const semanticContent = activeContent
      ? (JSON.parse(activeContent) as ContentNode)
      : { type: 'doc', content: [] };
    const displayedContent = switchPublicationProfile(
      semanticContent,
      publicationProfileId,
      presentationOverrides
    ).content;
    if (!documentMatchesContent(editor.schema, editor.state.doc, displayedContent)) {
      editor.commands.setContent(displayedContent, {
        emitUpdate: false, // Don't trigger update event during switch
      });
    }
    lastSeededChapterIdRef.current = activeChapterId;
    lastPresentationSignatureRef.current = presentationSignature;
    // Announce unconditionally — including when the guard above skipped setContent, since the
    // document already matches. The endnotes panel's locator relies on this firing only once
    // the ProseMirror document genuinely carries this chapter's content.
    if (project?.activeChapterId) {
      onChapterDocumentReadyRef.current?.(project.activeChapterId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, project, publicationProfileId, presentationOverrides]);

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

  const { ignoreWord, addToDictionary } = useSpellCheck(editor, projectId ?? project?.id);
  const declineGrammarIssue = useGrammarIssueDecline(editor, projectId ?? project?.id);

  const { ambiguities, dismissAmbiguities } = useSemanticMigration(
    editor,
    project?.activeChapterId
  );

  if (!editor) return null;

  return (
    <div className="w-full bg-slate-50 relative">
      <SemanticAmbiguityBanner ambiguities={ambiguities} onDismiss={dismissAmbiguities} />
      <AutocompleteDot state={dotState} />
      {automaticSnapshotError && (
        <p className="px-2 py-1 text-xs text-muted-foreground" role="status">
          Le dernier snapshot automatique n’a pas pu être créé. Une nouvelle tentative aura lieu plus tard.
        </p>
      )}
      <TextIssuePalette
        editor={editor}
        onIgnoreWord={ignoreWord}
        onAddToDictionary={projectId ?? project?.id ? addToDictionary : undefined}
        onIgnoreGrammarIssue={
          projectId ?? project?.id ? declineGrammarIssue : undefined
        }
      />
      {/* Spoken counterpart of the (aria-hidden) dot: tells screen-reader users a
          suggestion is waiting and how to act on it. */}
      <div className="sr-only" role="status" aria-live="polite">
        {dotState === 'ready'
          ? 'Suggestion prête. Appuyez sur Tab pour l’afficher.'
          : dotState === 'visible'
            ? 'Suggestion affichée. Appuyez sur Tab pour l’accepter.'
            : ''}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
