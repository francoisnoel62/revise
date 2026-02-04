// ABOUTME: Main editor page with project loading.
// ABOUTME: Loads project from URL or creates new one.

'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { TextEditor } from '@/components/editor/TextEditor';
import { FormattingToolbar } from '@/components/editor/FormattingToolbar';
import { RewriteLoadingOverlay } from '@/components/editor/RewriteLoadingOverlay';
import { ChaptersSheet } from '@/components/navigation/ChaptersSheet';
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
import { FloatingGenerationMenu } from '@/components/editor/FloatingGenerationMenu';
import { PublishDialog } from '@/components/publish/PublishDialog';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { SearchReplaceBar } from '@/components/editor/SearchReplaceBar';
import { ChapterGenerationTypeKey } from '@/domain';
import { AnalysisConfigDialog, AnalysisConfig } from '@/components/analysis/AnalysisConfigDialog';
import { ChapterAnalysisPanel } from '@/components/analysis/ChapterAnalysisPanel';
import {
  analyzeChapter,
  applyCorrection,
  applyBatchCorrections,
  type AnalysisResultDTO,
  type AnalysisIssueDTO,
} from '@/app/actions/analysis-actions';
import type { AnalysisIssueData } from '@/components/analysis/AnalysisIssueCard';
import type { AnalysisSummaryStats } from '@/components/analysis/AnalysisSummaryCard';

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

  // Autocomplete state
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);

  // Generation state (for AI menu dropdown)
  const [generationLoading, setGenerationLoading] = useState(false);
  const [activeGenerationType, setActiveGenerationType] = useState<ChapterGenerationTypeKey | null>(null);

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);

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

      // Insert the new text
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(newText)
        .run();

      // Calculate the new selection range (inserted text)
      const newTo = from + newText.length;

      // Highlight the inserted text with yellow color
      editor
        .chain()
        .setTextSelection({ from, to: newTo })
        .setHighlight({ color: '#fef08a' }) // Tailwind yellow-200
        .run();

      // Remove highlight after 3 seconds
      setTimeout(() => {
        if (editor) {
          editor
            .chain()
            .setTextSelection({ from, to: newTo })
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
        // Update the editor content
        editor?.commands.setContent(result.data.newContent);

        // Update analysis result to mark issue as applied and adjust positions
        const delta = issue.suggestedText.length - issue.originalText.length;
        setAnalysisResult((prev) =>
          prev
            ? {
                ...prev,
                issues: prev.issues.map((i) => {
                  if (i.id === issueId) {
                    return { ...i, status: 'applied' as const };
                  }
                  // Adjust positions of issues that come after the applied correction
                  if (i.position.start > issue.position.end) {
                    return {
                      ...i,
                      position: {
                        start: i.position.start + delta,
                        end: i.position.end + delta,
                      },
                    };
                  }
                  return i;
                }),
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
        editor?.commands.setContent(result.data.newContent);

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
        byCategory: { spelling: 0, grammar: 0, punctuation: 0, repetition: 0, style: 0 },
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
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        {/* Mobile header (< 640px): super compact */}
        <div className="flex sm:hidden items-center justify-between px-2 py-2 gap-1">
          <div className="flex items-center shrink-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Retour aux projets" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ChaptersSheet />
          </div>
          <div className="flex-1 text-center min-w-0 px-1">
            <h1 className="text-sm font-semibold truncate">{project.title}</h1>
            <SaveStatus compact />
          </div>
          <div className="flex items-center shrink-0">
            <ExportDialog />
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
            <PublishDialog projectId={project.id} projectTitle={project.title} chapters={project.chapters} />
            <ExportDialog />
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
            <PublishDialog projectId={project.id} projectTitle={project.title} chapters={project.chapters} />
            <ExportDialog />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Toolbar sticky - responsive positioning for 3 breakpoints */}
      <div className="sticky top-13 lg:top-18.25 z-40 flex flex-col items-center py-1 lg:py-2 bg-slate-50 px-2 gap-2">
        <div className="w-full max-w-198.5">
          <div className="bg-white rounded-lg shadow border border-slate-200 px-1 md:px-2 py-1 overflow-x-auto">
            <FormattingToolbar
              editor={editor}
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
              onAnalyze={handleOpenAnalysisConfig}
              analysisLoading={analysisLoading}
            />
          </div>
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
      <div className="flex justify-center px-2 md:px-4 pb-8">
        <div className="w-full max-w-198.5">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
            <TextEditor
              onSelectionChange={handleSelectionChange}
              onEditorReady={(editorInstance) => setEditor(editorInstance)}
              autocompleteEnabled={autocompleteEnabled}
            />
            {/* Show AI generation menu when editor is empty and AI features are available */}
            <FloatingGenerationMenu
              editor={editor}
              projectId={project.id}
              isVisible={editor?.isEmpty ?? false}
              showAIFeatures={hasAIProviders}
            />
          </div>
        </div>
      </div>

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

      {/* Command palette */}
      {hasAIProviders && (
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
          providers={providers}
          selectedProviderId={selectedProviderId}
          onProviderChange={handleProviderChange}
        />
      )}

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
