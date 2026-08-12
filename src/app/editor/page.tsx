// ABOUTME: Main editor page with project loading and live publication-profile switching.
// ABOUTME: Coordinates semantic editing, paged preview, toolbar mode, and persisted settings.

'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, History } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { TextEditor } from '@/components/editor/TextEditor';
import { FormattingToolbar } from '@/components/editor/FormattingToolbar';
import { EditorPreviewLayout } from '@/components/editor/EditorPreviewLayout';
import { RewriteLoadingOverlay } from '@/components/editor/RewriteLoadingOverlay';
import { ChaptersSheet } from '@/components/navigation/ChaptersSheet';
import { ProjectSettingsMenu } from '@/components/navigation/ProjectSettingsMenu';
import { ProposalsSheet } from '@/components/proposals/ProposalsSheet';
import { ExportDialog } from '@/components/document/ExportDialog';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { CharacterCounter } from '@/components/editor/CharacterCounter';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Editor } from '@tiptap/react';
import { rewriteText } from '@/app/actions/rewrite-text';
import { listProvidersAction, SafeProvider } from '@/app/actions/provider-actions';
import { updateProjectProviderAction } from '@/app/actions/project-actions';
import { generateChapterAction } from '@/app/actions/chapter-generation-actions';
import { CorrectionHistoryDialog } from '@/components/history/CorrectionHistoryDialog';
import { SnapshotHistoryDialog } from '@/components/history/SnapshotHistoryDialog';
import { FloatingGenerationMenu } from '@/components/editor/FloatingGenerationMenu';
import {
  loadProjectSettingsAction,
  updateProjectSettingsAction,
} from '@/app/actions/project-settings-actions';
import {
  loadPresentationOverridesAction,
  savePresentationOverridesAction,
} from '@/app/actions/presentation-override-actions';
import {
  AutocompletePreferences,
  DEFAULT_AUTOCOMPLETE_PREFERENCES,
} from '@/domain/value-objects/AutocompletePreferences';
import {
  CanonExtractionPreferences,
  DEFAULT_CANON_EXTRACTION_PREFERENCES,
} from '@/domain/value-objects/CanonExtractionPreferences';
import { useSessionEndTrigger } from '@/hooks/useSessionEndTrigger';
import { useCanonFreshnessCheck } from '@/hooks/useCanonFreshnessCheck';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotificationStore } from '@/store/notificationStore';
import { ThesaurusPalette } from '@/components/editor/ThesaurusPalette';
import { PublishDialog } from '@/components/publish/PublishDialog';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { SearchReplaceBar } from '@/components/editor/SearchReplaceBar';
import { EndnoteModal } from '@/components/editor/EndnoteModal';
import { EndnotesPanel } from '@/components/editor/EndnotesPanel';
import { isEndnoteContentEmpty, type EndnoteContent } from '@/components/editor/extensions/EndnoteRef';
import { useEndnoteLocator } from '@/hooks/useEndnoteLocator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChapterGenerationTypeKey } from '@/domain';
import { AnalysisConfigDialog, AnalysisConfig } from '@/components/analysis/AnalysisConfigDialog';
import { ChapterAnalysisPanel } from '@/components/analysis/ChapterAnalysisPanel';
import {
  analyzeChapter,
  applyCorrection,
  applyBatchCorrections,
  type AnalysisResultDTO,
} from '@/app/actions/analysis-actions';
import type { AnalysisIssueData } from '@/components/analysis/AnalysisIssueCard';
import type { AnalysisSummaryStats } from '@/components/analysis/AnalysisSummaryCard';
import { PublicationProfileSelector } from '@/components/editor/PublicationProfileSelector';
import { LevelStylesPanel } from '@/components/editor/LevelStylesPanel';
import { PublicationPreview } from '@/components/editor/PublicationPreview';
import { BackgroundPageCounter } from '@/components/editor/BackgroundPageCounter';
import {
  PublicationProfile,
  type PublicationProfileId,
} from '@/domain/value-objects/PublicationProfile';
import { LevelStyleSet, type LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type {
  LevelStylesByProfile,
  PdfPublicationProfileId,
} from '@/domain/entities/ProjectSettings';
import type { PresentationOverrideLayer } from '@/domain/value-objects/PresentationOverride';
import type { ContentNode } from '@/domain/value-objects/ContentNode';
import { useBookPageOffset } from '@/hooks/useBookPageOffset';
import { useGrammarCheck } from '@/hooks/useGrammarCheck';
import {
  buildSemanticInsertContent,
  getSemanticRoleFromAttrs,
} from '@/application/services/PropositionInserter';

interface Proposal {
  content: string;
  styleLabel?: string;
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const {
    project,
    activeContent,
    isLoading,
    error,
    loadProject,
    invalidateCorrectionHistoryCache,
  } = useProjectStore();

  // UI state for proposals
  const [selection, setSelection] = useState({ from: 0, to: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [originalText, setOriginalText] = useState('');
  const [showProposals, setShowProposals] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Provider state
  const [providers, setProviders] = useState<SafeProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Calculate if user has valid AI providers (for showing/hiding AI features)
  const hasAIProviders = providers.filter((p) => p.isValid).length > 0;

  // History dialog state
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showSnapshotHistoryDialog, setShowSnapshotHistoryDialog] = useState(false);

  // Autocomplete state
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [autocompletePrefs, setAutocompletePrefs] = useState<AutocompletePreferences>(
    DEFAULT_AUTOCOMPLETE_PREFERENCES
  );
  const [publicationProfileId, setPublicationProfileId] =
    useState<PublicationProfileId>('kdp-6x9');
  const [presentationOverrides, setPresentationOverrides] =
    useState<PresentationOverrideLayer>([]);
  // Resolved server-side: a project has no settings document until its author opens the
  // settings page, so the answer comes from the project's creation date until then.
  const [honorBlankLines, setHonorBlankLines] = useState(false);
  const [levelStylesByProfile, setLevelStylesByProfile] =
    useState<LevelStylesByProfile>({});
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isLevelStylesSaving, setIsLevelStylesSaving] = useState(false);
  const overrideSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelStyleSaveTimersRef = useRef<
    Partial<Record<PdfPublicationProfileId, ReturnType<typeof setTimeout>>>
  >({});

  // Book-wide page offset tracking
  const { startPageNumber, onPageCountChange, nextChapterIdToRender } = useBookPageOffset({
    chapters: (project?.chapters ?? []).map((c) => ({
      id: c.id,
      contentVersion: c.metadata.lastEdited,
    })),
    activeChapterId: project?.activeChapterId ?? null,
    profileId: publicationProfileId,
  });

  // Content for the chapter being rendered in the background
  const backgroundChapterContent =
    project?.chapters.find((c) => c.id === nextChapterIdToRender)?.content ?? null;

  // Canon extraction mode
  const [canonExtractionPrefs, setCanonExtractionPrefs] = useState<CanonExtractionPreferences>(
    DEFAULT_CANON_EXTRACTION_PREFERENCES
  );

  // Load per-project autocomplete preferences when project is known. The toolbar
  // toggle is the single effective on/off for the session, seeded from the saved
  // preference so it can never misrepresent the persisted state.
  useEffect(() => {
    if (!project?.id) return;
    loadProjectSettingsAction(project.id).then((result) => {
      if (result.success && result.settings) {
        setAutocompletePrefs(result.settings.autocompletePreferences);
        setAutocompleteEnabled(result.settings.autocompletePreferences.enabled);
        setCanonExtractionPrefs(result.settings.canonExtractionPreferences);
        setPublicationProfileId(result.settings.publicationProfileId);
        setLevelStylesByProfile(result.settings.levelStylesByProfile);
      }
      if (result.success) {
        setHonorBlankLines(result.honorBlankLines);
      }
    });
  }, [project?.id]);

  useEffect(() => {
    const chapterId = project?.activeChapterId;
    if (!chapterId) {
      setPresentationOverrides([]);
      return;
    }

    let cancelled = false;
    setPresentationOverrides([]);
    loadPresentationOverridesAction(chapterId).then((result) => {
      if (!cancelled && result.success) setPresentationOverrides(result.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [project?.activeChapterId]);

  useEffect(
    () => () => {
      if (overrideSaveTimerRef.current) clearTimeout(overrideSaveTimerRef.current);
      Object.values(levelStyleSaveTimersRef.current).forEach((timer) => clearTimeout(timer));
    },
    []
  );

  const handlePresentationOverridesChange = (overrides: PresentationOverrideLayer) => {
    setPresentationOverrides(overrides);
    const chapterId = project?.activeChapterId;
    if (!chapterId || publicationProfileId !== 'passerelle') return;

    if (overrideSaveTimerRef.current) clearTimeout(overrideSaveTimerRef.current);
    overrideSaveTimerRef.current = setTimeout(() => {
      void savePresentationOverridesAction(chapterId, overrides);
    }, 500);
  };

  const handlePublicationProfileChange = async (targetProfileId: PublicationProfileId) => {
    if (!project || targetProfileId === publicationProfileId) return;

    const previousProfileId = publicationProfileId;
    setPublicationProfileId(targetProfileId);
    setIsProfileSaving(true);

    if (previousProfileId === 'passerelle' && project.activeChapterId) {
      if (overrideSaveTimerRef.current) clearTimeout(overrideSaveTimerRef.current);
      const overrideResult = await savePresentationOverridesAction(
        project.activeChapterId,
        presentationOverrides
      );
      if (!overrideResult.success) {
        setPublicationProfileId(previousProfileId);
        setIsProfileSaving(false);
        return;
      }
    }

    const result = await updateProjectSettingsAction(project.id, {
      publicationProfileId: targetProfileId,
    });

    if (!result.success) {
      setPublicationProfileId(previousProfileId);
    }
    setIsProfileSaving(false);
  };

  // Persisted as an explicit choice, which from then on beats the creation-date default.
  const handleHonorBlankLinesChange = async (next: boolean) => {
    if (!project) return;
    const previous = honorBlankLines;
    setHonorBlankLines(next);
    const result = await updateProjectSettingsAction(project.id, { honorBlankLines: next });
    if (!result.success) setHonorBlankLines(previous);
  };

  const handleLevelStylesChange = (
    profileId: PdfPublicationProfileId,
    styles: LevelStyleSetProperties,
  ) => {
    setLevelStylesByProfile((current) => ({ ...current, [profileId]: styles }));
    if (!project) return;

    const pendingTimer = levelStyleSaveTimersRef.current[profileId];
    if (pendingTimer) clearTimeout(pendingTimer);
    setIsLevelStylesSaving(true);
    levelStyleSaveTimersRef.current[profileId] = setTimeout(async () => {
      const result = await updateProjectSettingsAction(project.id, {
        levelStyles: { profileId, styles },
      });
      if (!result.success) {
        const reloaded = await loadProjectSettingsAction(project.id);
        if (reloaded.success && reloaded.settings) {
          setLevelStylesByProfile(reloaded.settings.levelStylesByProfile);
        }
      }
      delete levelStyleSaveTimersRef.current[profileId];
      setIsLevelStylesSaving(Object.keys(levelStyleSaveTimersRef.current).length > 0);
    }, 400);
  };

  const activeLevelStyles =
    publicationProfileId === 'passerelle'
      ? undefined
      : levelStylesByProfile[publicationProfileId] ??
        LevelStyleSet.defaultsFor(PublicationProfile.fromId(publicationProfileId)).values;

  // On-demand local grammar check — free, deterministic, no AI provider involved.
  const {
    checkChapter: correctChapter,
    loading: correctionLoading,
    status: correctionStatus,
    punctuationChecked,
    setPunctuationChecked,
  } = useGrammarCheck(editor, project?.id, project?.activeChapterId ?? null);

  const { notification: canonNotification, dismissNotification: dismissCanonNotification } =
    useSessionEndTrigger({
      projectId: project?.id ?? '',
      mode: canonExtractionPrefs.mode,
      providerId: selectedProviderId,
    });

  const addNotification = useNotificationStore((s) => s.addNotification);

  // Forward session-end extraction results to the notification center
  useEffect(() => {
    if (!canonNotification) return;
    addNotification({
      type: canonNotification.type === 'success' ? 'canon-done' : 'canon-error',
      title: canonNotification.type === 'success' ? 'Canon mis à jour' : 'Erreur canon',
      message: canonNotification.message,
      severity: canonNotification.type === 'success' ? 'success' : 'error',
    });
    dismissCanonNotification();
  }, [canonNotification, addNotification, dismissCanonNotification]);

  // Generation state (for AI menu dropdown)
  const [generationLoading, setGenerationLoading] = useState(false);
  const [activeGenerationType, setActiveGenerationType] = useState<ChapterGenerationTypeKey | null>(null);

  // Preview scroll sync: the editor drives the sticky preview's internal scroll position,
  // recalibrated every 1000 words instead of a single global ratio so drift can't accumulate.
  const [scrollPosition, setScrollPosition] = useState({ segmentIndex: 0, localRatio: 0 });
  useEffect(() => {
    setScrollPosition({ segmentIndex: 0, localRatio: 0 });
  }, [project?.activeChapterId]);

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Endnote modal state. `pos === null` means insertion; a number means editing an
  // existing call at that document position.
  const [endnoteModal, setEndnoteModal] = useState<{
    open: boolean;
    pos: number | null;
    content: EndnoteContent | null;
  }>({ open: false, pos: null, content: null });
  // Pending deletion of a non-empty note, awaiting confirmation.
  const [endnoteToDelete, setEndnoteToDelete] = useState<{
    pos: number;
    content: EndnoteContent | null;
  } | null>(null);
  const [showEndnotesPanel, setShowEndnotesPanel] = useState(false);
  // The chapter TextEditor last confirmed it finished re-seeding its document for — distinct
  // from project.activeChapterId, which the store updates before the editor has caught up.
  const [readyChapterId, setReadyChapterId] = useState<string | null>(null);

  const openInsertEndnote = () => setEndnoteModal({ open: true, pos: null, content: null });
  const openEditEndnote = (pos: number, content: EndnoteContent | null) =>
    setEndnoteModal({ open: true, pos, content });
  const closeEndnoteModal = () => setEndnoteModal({ open: false, pos: null, content: null });

  const handleEndnoteSubmit = (content: EndnoteContent) => {
    if (editor) {
      if (endnoteModal.pos !== null) {
        editor.chain().focus().updateEndnote(endnoteModal.pos, content).run();
      } else {
        editor.chain().focus().insertEndnote(content).run();
      }
    }
    closeEndnoteModal();
  };

  const confirmDeleteEndnote = () => {
    if (editor && endnoteToDelete) {
      editor.chain().focus().deleteEndnote(endnoteToDelete.pos).run();
    }
    setEndnoteToDelete(null);
  };

  // Switches the active chapter and reports whether it actually took, so the endnotes panel's
  // locator knows whether to keep waiting for the document handshake or give up.
  const switchToChapter = async (chapterId: string): Promise<boolean> => {
    await useProjectStore.getState().setActiveChapter(chapterId);
    return useProjectStore.getState().project?.activeChapterId === chapterId;
  };

  const endnoteLocator = useEndnoteLocator({
    editor,
    activeChapterId: project?.activeChapterId ?? null,
    readyChapterId,
    switchToChapter,
    onEdit: openEditEndnote,
    onDelete: (pos, content) => setEndnoteToDelete({ pos, content }),
  });

  // Search/Replace state
  const [showSearchReplace, setShowSearchReplace] = useState(false);

  // Chapter analysis state
  const [showAnalysisConfig, setShowAnalysisConfig] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultDTO | null>(null);
  const [applyingIssueId, setApplyingIssueId] = useState<string | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  // Keyboard shortcut for search (Ctrl+F / Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearchReplace(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track initialization to prevent infinite loop
  const initializedRef = useRef(false);
  const currentProjectIdRef = useRef<string | null>(null);
  const providersLoadedRef = useRef<string | null>(null);

  // Load project on mount
  useEffect(() => {
    // Skip if already initialized with this projectId
    if (initializedRef.current && currentProjectIdRef.current === projectId) {
      return;
    }

    async function initProject() {
      if (projectId) {
        // Load existing project
        currentProjectIdRef.current = projectId;
        initializedRef.current = true;
        await loadProject(projectId);
      } else if (!initializedRef.current) {
        // No project ID in URL - redirect to dashboard
        // Users should select/create projects from dashboard, not auto-create here
        initializedRef.current = true;
        router.replace('/dashboard');
      }
    }

    initProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only depend on projectId changes

  // Handle auth redirect
  useEffect(() => {
    if (error?.includes('sign in')) {
      router.push('/auth/signin');
    }
  }, [error, router]);

  // Load providers when project loads
  useEffect(() => {
    async function loadProviders() {
      setProvidersLoading(true);
      const result = await listProvidersAction();

      if (result.success && result.data) {
        setProviders(result.data);
      }
      setProvidersLoading(false);
    }

    // Only load providers once per project
    if (project?.id && providersLoadedRef.current !== project.id) {
      providersLoadedRef.current = project.id;
      // Initialize selected provider from project
      setSelectedProviderId(project.providerId ?? null);
      loadProviders();
    }
  }, [project?.id, project?.providerId]);

  useCanonFreshnessCheck({
    projectId: project?.id ?? null,
    providerId: selectedProviderId,
    providersLoading,
  });

  // Selection change handler
  const handleSelectionChange = (from: number, to: number) => {
    setSelection({ from, to });
    setHasSelection(from !== to);
  };

  // Provider change handler
  const handleProviderChange = async (providerId: string | null) => {
    if (!project?.id) return;

    // Update local state immediately for responsive UI
    setSelectedProviderId(providerId);

    // Persist to database
    const result = await updateProjectProviderAction(project.id, providerId);
    if (!result.success) {
      // Revert on error
      setSelectedProviderId(project.providerId ?? null);
      alert(`Erreur: ${result.error}`);
    }
  };

  // Rewrite handler
  const handleRewrite = async () => {
    if (!project?.id || !project.activeChapterId) return;

    // Check if provider is selected
    if (!selectedProviderId) {
      alert('Veuillez sélectionner un fournisseur IA.');
      return;
    }

    // CRITICAL: Extract selected text directly from TipTap editor
    // This avoids the JSON/text position mismatch bug where TipTap positions
    // don't match positions in the JSON string representation
    if (!editor) return;

    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');
    if (!selectedText.trim()) {
      alert('Veuillez sélectionner du texte à réécrire.');
      return;
    }

    setRewriteLoading(true);

    try {
      const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId);
      if (!activeChapter) return;

      const result = await rewriteText(
        project.id,
        activeChapter.id,  // Chapter ID for history tracking
        activeChapter.content,
        selection.from,
        selection.to,
        selectedText  // Pass the actual selected text to avoid extraction issues
      );

      if (!result.success) {
        alert(`Erreur: ${result.error}`);
        return;
      }

      // Invalidate history cache since new correction was saved
      invalidateCorrectionHistoryCache(activeChapter.id);

      setProposals(result.data?.map(p => ({ content: p.content, styleLabel: p.styleLabel })) || []);
      setOriginalText(selectedText);
      setShowProposals(true);
    } catch (error) {
      alert('Une erreur est survenue lors de la réécriture.');
      console.error(error);
    } finally {
      setRewriteLoading(false);
    }
  };

  // Chapter generation handler (from AI menu)
  const handleGenerate = async (generationType: ChapterGenerationTypeKey) => {
    if (!project?.id || !editor) return;

    setGenerationLoading(true);
    setActiveGenerationType(generationType);

    try {
      const result = await generateChapterAction(project.id, generationType);

      if (!result.success) {
        alert(result.error || 'Erreur lors de la génération');
        return;
      }

      // Insert generated content into editor
      const content = JSON.parse(result.data.tipTapContent);
      editor.commands.setContent(content);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setGenerationLoading(false);
      setActiveGenerationType(null);
    }
  };

  // Insert proposal handler
  const handleInsert = (newText: string) => {
    if (editor) {
      const { from, to } = selection;

      // Determine the semantic role of the host block; validation logic stays in the
      // Application layer (getSemanticRoleFromAttrs).
      const $pos = editor.state.doc.resolve(from);
      const hostNode = $pos.node($pos.depth);
      const semanticRole = getSemanticRoleFromAttrs(
        hostNode.attrs as Record<string, unknown> | undefined
      );

      const content = buildSemanticInsertContent(newText, semanticRole);

      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(content)
        .run();

      // Highlight the inserted region so the author can see what changed.
      // For strings, use text length. For node arrays, use the current cursor
      // as end (TipTap places it after the last inserted node).
      const highlightFrom = from;
      const highlightTo =
        typeof content === 'string'
          ? from + content.length
          : editor.state.selection.to;

      editor
        .chain()
        .setTextSelection({ from: highlightFrom, to: highlightTo })
        .setHighlight({ color: '#fef08a' })
        .run();

      setTimeout(() => {
        if (editor) {
          editor
            .chain()
            .setTextSelection({ from: highlightFrom, to: highlightTo })
            .unsetHighlight()
            .run();
        }
      }, 3000);
    }

    setShowProposals(false);
  };

  // Chapter analysis handlers
  const handleOpenAnalysisConfig = () => {
    setShowAnalysisConfig(true);
  };

  const handleStartAnalysis = async (config: AnalysisConfig) => {
    if (!project?.id || !project.activeChapterId) return;

    setAnalysisLoading(true);
    setShowAnalysisConfig(false);

    try {
      const result = await analyzeChapter(
        project.id,
        project.activeChapterId,
        config.categories,
        config.styleRigor
      );

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setShowAnalysisPanel(true);
      } else if (!result.success) {
        alert(result.error || 'Erreur lors de l\'analyse');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleApplyCorrection = async (issueId: string) => {
    if (!project?.id || !project.activeChapterId || !analysisResult) return;

    const issue = analysisResult.issues.find((i) => i.id === issueId);
    if (!issue) return;

    setApplyingIssueId(issueId);
    try {
      const result = await applyCorrection(
        project.id,
        project.activeChapterId,
        issue
      );

      if (result.success && result.data) {
        // Update the editor content (parse JSON string to object for TipTap)
        editor?.commands.setContent(JSON.parse(result.data.newContent));

        // Mark issue as applied (no position adjustment needed with text-based matching)
        setAnalysisResult((prev) =>
          prev
            ? {
                ...prev,
                issues: prev.issues.map((i) =>
                  i.id === issueId ? { ...i, status: 'applied' as const } : i
                ),
              }
            : null
        );
      } else if (!result.success) {
        alert(result.error || 'Erreur lors de l\'application');
      }
    } finally {
      setApplyingIssueId(null);
    }
  };

  const handleIgnoreIssue = (issueId: string) => {
    // Update analysis result to mark issue as ignored (local state only)
    setAnalysisResult((prev) =>
      prev
        ? {
            ...prev,
            issues: prev.issues.map((i) =>
              i.id === issueId ? { ...i, status: 'ignored' as const } : i
            ),
          }
        : null
    );
  };

  const handleApplyAllCorrections = async () => {
    if (!project?.id || !project.activeChapterId || !analysisResult) return;

    const pendingIssues = analysisResult.issues.filter((i) => i.status === 'pending');
    if (pendingIssues.length === 0) return;

    setIsApplyingAll(true);
    try {
      const result = await applyBatchCorrections(
        project.id,
        project.activeChapterId,
        pendingIssues
      );

      if (result.success && result.data) {
        // Parse JSON string to object for TipTap
        editor?.commands.setContent(JSON.parse(result.data.newContent));

        // Mark all pending issues as applied
        setAnalysisResult((prev) =>
          prev
            ? {
                ...prev,
                issues: prev.issues.map((i) =>
                  i.status === 'pending' ? { ...i, status: 'applied' as const } : i
                ),
              }
            : null
        );
      } else if (!result.success) {
        alert(result.error || 'Erreur lors de l\'application');
      }
    } finally {
      setIsApplyingAll(false);
    }
  };

  const handleCloseAnalysisPanel = () => {
    setShowAnalysisPanel(false);
  };

  // Transform AnalysisResultDTO to component types
  const analysisIssues: AnalysisIssueData[] = analysisResult?.issues ?? [];
  const analysisStats: AnalysisSummaryStats = analysisResult
    ? {
        totalIssues: analysisResult.stats.totalIssues,
        pendingIssues: analysisResult.issues.filter((i) => i.status === 'pending').length,
        appliedIssues: analysisResult.issues.filter((i) => i.status === 'applied').length,
        ignoredIssues: analysisResult.issues.filter((i) => i.status === 'ignored').length,
        byCategory: analysisResult.stats.byCategory,
      }
    : {
        totalIssues: 0,
        pendingIssues: 0,
        appliedIssues: 0,
        ignoredIssues: 0,
        byCategory: { repetition: 0, style: 0 },
      };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error && !error.includes('sign in')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary underline"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null; // Will redirect or show loading
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header with controls - 3-level responsive layout */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 relative">
        {/* Mobile header (< 640px): super compact */}
        <div className="flex sm:hidden items-center justify-between px-2 py-2 gap-1">
          <div className="flex items-center shrink-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Retour aux projets" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ChaptersSheet />
            <ProjectSettingsMenu projectId={project.id} />
            <Button
              variant="ghost"
              size="icon"
              title="Historique des versions"
              className="h-8 w-8"
              onClick={() => setShowSnapshotHistoryDialog(true)}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 text-center min-w-0 px-1">
            <h1 className="text-sm font-semibold truncate">{project.title}</h1>
            <SaveStatus compact />
          </div>
          <div className="flex items-center shrink-0">
            <NotificationBell />
            <ExportDialog publicationProfileId={publicationProfileId} />
            <UserMenu />
          </div>
        </div>

        {/* Tablet header (640px-1024px): medium layout */}
        <div className="hidden sm:flex lg:hidden items-center justify-between px-3 py-2 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Retour aux projets" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ChaptersSheet />
            <ProjectSettingsMenu projectId={project.id} />
            <Button
              variant="ghost"
              size="icon"
              title="Historique des versions"
              className="h-8 w-8"
              onClick={() => setShowSnapshotHistoryDialog(true)}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 text-center min-w-0 px-2">
            <h1 className="text-base font-semibold truncate">{project.title}</h1>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-37.5">{project.chapters.find((c) => c.id === project.activeChapterId)?.title || 'Sans titre'}</span>
              <span>·</span>
              <SaveStatus compact />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell />
            {publicationProfileId !== 'passerelle' && (
              <Link href={`/book-preview?project=${project.id}`}>
                <Button variant="ghost" size="icon" title="Aperçu livre entier">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <PublishDialog projectId={project.id} projectTitle={project.title} chapters={project.chapters} />
            <ExportDialog publicationProfileId={publicationProfileId} />
            <UserMenu />
          </div>
        </div>

        {/* Desktop header (≥1024px): full 3-column grid */}
        <div className="hidden lg:grid grid-cols-3 items-center px-4 py-3">
          {/* Left: navigation */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Retour aux projets">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ChaptersSheet />
            <ProjectSettingsMenu projectId={project.id} />
            <Button
              variant="ghost"
              size="icon"
              title="Historique des versions"
              className="h-8 w-8"
              onClick={() => setShowSnapshotHistoryDialog(true)}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          {/* Center: project title */}
          <div className="text-center">
            <h1 className="text-lg font-semibold">{project.title}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{project.chapters.find((c) => c.id === project.activeChapterId)?.title || 'Sans titre'}</span>
              <span>·</span>
              <SaveStatus />
              <span>·</span>
              <CharacterCounter editor={editor} />
            </div>
          </div>
          {/* Right: controls */}
          <div className="flex items-center justify-end gap-2">
            <span data-testid="canon-mode-indicator" data-canon-mode={canonExtractionPrefs.mode} aria-hidden className="sr-only" />
            <NotificationBell />
            {publicationProfileId !== 'passerelle' && (
              <Link href={`/book-preview?project=${project.id}`}>
                <Button variant="ghost" size="icon" title="Aperçu livre entier">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <PublishDialog projectId={project.id} projectTitle={project.title} chapters={project.chapters} />
            <ExportDialog publicationProfileId={publicationProfileId} />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Toolbar sticky - responsive positioning for 3 breakpoints */}
      <div className="sticky top-13 lg:top-18.25 z-40 flex flex-col items-center py-1 lg:py-2 bg-slate-50 px-2 gap-2">
        <div className="w-full max-w-198.5">
          <div className="mb-2 flex justify-end gap-2">
            {publicationProfileId !== 'passerelle' && activeLevelStyles && (
              <LevelStylesPanel
                profileId={publicationProfileId}
                styles={activeLevelStyles}
                onChange={(styles) => handleLevelStylesChange(publicationProfileId, styles)}
                honorBlankLines={honorBlankLines}
                onHonorBlankLinesChange={handleHonorBlankLinesChange}
                isSaving={isLevelStylesSaving}
              />
            )}
            <PublicationProfileSelector
              value={publicationProfileId}
              onChange={handlePublicationProfileChange}
              isSaving={isProfileSaving}
            />
          </div>
          <div className="bg-white rounded-lg shadow border border-slate-200 px-1 md:px-2 py-1 overflow-x-auto">
            <FormattingToolbar
              editor={editor}
              profile={publicationProfileId === 'passerelle' ? 'passerelle' : 'print-ready'}
              hasSelection={hasSelection}
              onRewrite={handleRewrite}
              rewriteLoading={rewriteLoading}
              providers={providers}
              selectedProviderId={selectedProviderId}
              onProviderChange={handleProviderChange}
              providersLoading={providersLoading}
              onHistoryClick={() => setShowHistoryDialog(true)}
              autocompleteEnabled={autocompleteEnabled}
              onAutocompleteChange={setAutocompleteEnabled}
              showAIFeatures={hasAIProviders}
              isChapterEmpty={editor?.isEmpty ?? false}
              onGenerate={handleGenerate}
              generationLoading={generationLoading}
              activeGenerationType={activeGenerationType}
              onOpenCommandPalette={() => setShowCommandPalette(true)}
              onSearchClick={() => setShowSearchReplace(true)}
              onInsertEndnote={openInsertEndnote}
              onOpenEndnotes={() => setShowEndnotesPanel(true)}
              onAnalyze={handleOpenAnalysisConfig}
              analysisLoading={analysisLoading}
              onCorrect={correctChapter}
              correctionLoading={correctionLoading}
              punctuationChecked={punctuationChecked}
              onPunctuationChange={setPunctuationChecked}
            />
          </div>
          {correctionStatus && (
            <p className="px-2 pt-1 text-xs text-muted-foreground" role="status">
              {correctionStatus}
            </p>
          )}
        </div>
        {/* Search/Replace bar */}
        <div className="w-full max-w-198.5">
          <SearchReplaceBar
            editor={editor}
            isOpen={showSearchReplace}
            onClose={() => setShowSearchReplace(false)}
          />
        </div>
      </div>

      {/* Editor container - responsive width */}
      <EditorPreviewLayout
        onEditorScrollProgress={setScrollPosition}
        editor={editor}
        editorSlot={
          <>
            <TextEditor
              onSelectionChange={handleSelectionChange}
              onEditorReady={(editorInstance) => setEditor(editorInstance)}
              autocompleteEnabled={autocompleteEnabled}
              autocompletePreferences={autocompletePrefs}
              publicationProfileId={publicationProfileId}
              presentationOverrides={presentationOverrides}
              onPresentationOverridesChange={handlePresentationOverridesChange}
              onEndnoteInsertRequest={openInsertEndnote}
              onEndnoteEditRequest={openEditEndnote}
              onEndnoteDeleteRequest={(pos, content) => setEndnoteToDelete({ pos, content })}
              onChapterDocumentReady={setReadyChapterId}
            />
            {/* Thesaurus palette — opens on right-click of a word in the editor */}
            <ThesaurusPalette
              editor={editor}
              projectId={project.id}
              showAILayer={hasAIProviders}
            />
            {/* Show AI generation menu when editor is empty and AI features are available */}
            <FloatingGenerationMenu
              editor={editor}
              projectId={project.id}
              isVisible={editor?.isEmpty ?? false}
              showAIFeatures={hasAIProviders}
            />
          </>
        }
        previewSlot={
          <PublicationPreview
            content={JSON.parse(activeContent) as ContentNode}
            profileId={publicationProfileId}
            overrides={presentationOverrides}
            startPageNumber={startPageNumber}
            onPageCountChange={(count) => {
              if (project.activeChapterId) onPageCountChange(project.activeChapterId, count);
            }}
            levelStyles={activeLevelStyles}
            honorBlankLines={honorBlankLines}
            scrollPosition={scrollPosition}
          />
        }
      />

      {/* Background chapter renderer for book-wide page offset computation */}
      <BackgroundPageCounter
        chapterId={nextChapterIdToRender}
        content={backgroundChapterContent}
        profileId={publicationProfileId}
        onPageCount={onPageCountChange}
        levelStyles={activeLevelStyles}
        honorBlankLines={honorBlankLines}
      />

      {/* Loading overlay with author quotes */}
      <RewriteLoadingOverlay isVisible={rewriteLoading} />

      {/* Proposals panel */}
      <ProposalsSheet
        open={showProposals}
        proposals={proposals}
        originalText={originalText}
        onInsert={handleInsert}
        onClose={() => setShowProposals(false)}
      />

      {/* Correction history dialog */}
      {project && project.activeChapterId && (
        <CorrectionHistoryDialog
          projectId={project.id}
          chapterId={project.activeChapterId}
          chapterTitle={project.chapters.find((c) => c.id === project.activeChapterId)?.title ?? 'Chapitre'}
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
        />
      )}

      {/* Snapshot (version) history dialog */}
      <SnapshotHistoryDialog
        projectId={project.id}
        open={showSnapshotHistoryDialog}
        onOpenChange={setShowSnapshotHistoryDialog}
      />

      {/* Command palette — always mounted: "Corriger le chapitre" needs no provider,
          and every AI command inside is already gated on one. */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        hasSelection={hasSelection}
        onRewrite={handleRewrite}
        rewriteLoading={rewriteLoading}
        isChapterEmpty={editor?.isEmpty ?? false}
        onGenerate={handleGenerate}
        generationLoading={generationLoading}
        onHistoryClick={() => {
          setShowCommandPalette(false);
          setShowHistoryDialog(true);
        }}
        autocompleteEnabled={autocompleteEnabled}
        onAutocompleteChange={setAutocompleteEnabled}
        onAnalyze={() => {
          setShowCommandPalette(false);
          handleOpenAnalysisConfig();
        }}
        analysisLoading={analysisLoading}
        onCorrect={() => {
          setShowCommandPalette(false);
          correctChapter();
        }}
        correctionLoading={correctionLoading}
        onInsertEndnote={openInsertEndnote}
        onOpenEndnotes={() => setShowEndnotesPanel(true)}
        providers={providers}
        selectedProviderId={selectedProviderId}
        onProviderChange={handleProviderChange}
      />

      {/* Endnote insertion / edition modal */}
      <EndnoteModal
        open={endnoteModal.open}
        initialContent={endnoteModal.content}
        onSubmit={handleEndnoteSubmit}
        onCancel={closeEndnoteModal}
      />

      {/* Endnotes list panel */}
      <EndnotesPanel
        open={showEndnotesPanel}
        onOpenChange={setShowEndnotesPanel}
        chapters={project.chapters}
        activeChapterId={project.activeChapterId}
        activeContent={activeContent}
        onEditNote={(chapterId, rank) => endnoteLocator.locateEndnote(chapterId, rank, 'edit')}
        onDeleteNote={(chapterId, rank) => endnoteLocator.locateEndnote(chapterId, rank, 'delete')}
        isLocating={endnoteLocator.isLocating}
      />

      {/* A note the panel couldn't act on — a rank missing once loaded, or a failed chapter
          switch — surfaced, never a silent no-op. */}
      <AlertDialog
        open={endnoteLocator.error !== null}
        onOpenChange={(open) => !open && endnoteLocator.clearError()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Action impossible</AlertDialogTitle>
            <AlertDialogDescription>{endnoteLocator.error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={endnoteLocator.clearError}>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm deletion of a note — systematic even for an empty one, since a trash icon in a
          list must never delete silently. */}
      <AlertDialog
        open={endnoteToDelete !== null}
        onOpenChange={(open) => !open && setEndnoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la note ?</AlertDialogTitle>
            <AlertDialogDescription>
              {endnoteToDelete && isEndnoteContentEmpty(endnoteToDelete.content)
                ? 'Cette note est vide. Sa suppression retirera l’appel.'
                : 'Cette note contient du texte. Sa suppression retirera l’appel et son contenu.'}{' '}
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEndnote}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chapter analysis configuration dialog */}
      <AnalysisConfigDialog
        open={showAnalysisConfig}
        onStart={handleStartAnalysis}
        onCancel={() => setShowAnalysisConfig(false)}
        isLoading={analysisLoading}
      />

      {/* Chapter analysis results panel */}
      <ChapterAnalysisPanel
        open={showAnalysisPanel}
        issues={analysisIssues}
        stats={analysisStats}
        onApply={handleApplyCorrection}
        onIgnore={handleIgnoreIssue}
        onApplyAll={handleApplyAllCorrections}
        onClose={handleCloseAnalysisPanel}
        chapterTitle={project.chapters.find((c) => c.id === project.activeChapterId)?.title || 'Chapitre'}
        applyingIssueId={applyingIssueId}
        isApplyingAll={isApplyingAll}
      />

    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
