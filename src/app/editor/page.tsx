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
import { DocumentControls } from '@/components/document/DocumentControls';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { CharacterCounter } from '@/components/editor/CharacterCounter';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Editor } from '@tiptap/react';
import { rewriteText } from '@/app/actions/rewrite-text';
import {
  checkSpellingWithCache,
  updateCacheAfterCorrection,
  loadSpellCheckCache,
  updateAutoSpellCheck,
} from '@/app/actions/spellcheck-cache-actions';
import { listProvidersAction, SafeProvider } from '@/app/actions/provider-actions';
import { updateProjectProviderAction } from '@/app/actions/project-actions';
import { generateChapterAction } from '@/app/actions/chapter-generation-actions';
import { CorrectionHistoryDialog } from '@/components/history/CorrectionHistoryDialog';
import { FloatingGenerationMenu } from '@/components/editor/FloatingGenerationMenu';
import { PublishDialog } from '@/components/publish/PublishDialog';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { ChapterGenerationTypeKey } from '@/domain';
import { SpellCheckSheet } from '@/components/editor/SpellCheckSheet';

interface Proposal {
  content: string;
  styleLabel?: string;
}

interface SpellCheckCorrectionDTO {
  original: string;
  corrected: string;
  type: 'spelling' | 'grammar' | 'style' | 'punctuation';
  explanation: string;
  typeLabel: string;
}

interface SpellCheckResultDTO {
  corrections: SpellCheckCorrectionDTO[];
  correctedText: string;
  hasErrors: boolean;
  summary: string;
}

interface SpellCheckCacheDTO {
  id: string;
  chapterId: string;
  projectId: string;
  contentHash: string;
  corrections: SpellCheckCorrectionDTO[];
  correctionCount: number;
  hasErrors: boolean;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
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

  // Spell check state
  const [spellCheckLoading, setSpellCheckLoading] = useState(false);
  const [spellCheckResult, setSpellCheckResult] = useState<SpellCheckResultDTO | null>(null);
  const [showSpellCheckSheet, setShowSpellCheckSheet] = useState(false);
  const [spellCheckCount, setSpellCheckCount] = useState(0);
  const [spellCheckStale, setSpellCheckStale] = useState(false);
  const [autoSpellCheckEnabled, setAutoSpellCheckEnabled] = useState(false);
  const [lastCheckedContentRef, setLastCheckedContentRef] = useState<string | null>(null);

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
      // Initialize auto spell check setting from project
      setAutoSpellCheckEnabled(project.autoSpellCheck ?? false);
      loadProviders();
    }
  }, [project?.id, project?.providerId, project?.autoSpellCheck]);

  // Load spell check cache and auto-check when chapter changes
  useEffect(() => {
    async function loadCacheAndAutoCheck() {
      if (!project?.id || !project.activeChapterId || !selectedProviderId) return;

      const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId);
      if (!activeChapter?.content) return;

      // Reset spell check state when chapter changes to avoid showing old data
      setSpellCheckResult(null);
      setSpellCheckCount(0);
      setSpellCheckStale(false);
      setLastCheckedContentRef(null);

      // Try to load existing cache for this chapter
      const cacheResult = await loadSpellCheckCache(activeChapter.id, activeChapter.content);

      if (cacheResult.success && cacheResult.data) {
        // Cache exists
        setSpellCheckCount(cacheResult.data.correctionCount);
        setSpellCheckStale(cacheResult.data.isStale);
        setLastCheckedContentRef(activeChapter.content);

        // If cache is valid (not stale), use it
        if (!cacheResult.data.isStale) {
          // Convert cache to result format for the sheet
          setSpellCheckResult({
            corrections: cacheResult.data.corrections,
            correctedText: '', // Not used for cached results
            hasErrors: cacheResult.data.hasErrors,
            summary: `${cacheResult.data.correctionCount} corrections trouvées`,
          });
        } else if (autoSpellCheckEnabled) {
          // Cache is stale and auto-check is enabled - run fresh check
          handleSpellCheckWithCache();
        }
      } else if (autoSpellCheckEnabled) {
        // No cache exists and auto-check is enabled - run check
        handleSpellCheckWithCache();
      } else {
        // No cache and no auto-check - reset state
        setSpellCheckCount(0);
        setSpellCheckStale(false);
        setSpellCheckResult(null);
        setLastCheckedContentRef(null);
      }
    }

    loadCacheAndAutoCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.activeChapterId, autoSpellCheckEnabled]);

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

  // Spell check handler with caching
  const handleSpellCheckWithCache = async () => {
    if (!project?.id || !project.activeChapterId) return;

    // Check if provider is selected
    if (!selectedProviderId) {
      alert('Veuillez sélectionner un fournisseur IA.');
      return;
    }

    const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId);
    if (!activeChapter || !activeChapter.content) {
      alert('Aucun contenu à vérifier.');
      return;
    }

    setSpellCheckLoading(true);
    setShowSpellCheckSheet(true);
    setSpellCheckResult(null);

    try {
      const result = await checkSpellingWithCache(
        project.id,
        activeChapter.id,
        activeChapter.content
      );

      if (!result.success) {
        alert(`Erreur: ${result.error}`);
        setShowSpellCheckSheet(false);
        return;
      }

      // Update cache state
      setSpellCheckCount(result.data.correctionCount);
      setSpellCheckStale(false);
      setLastCheckedContentRef(activeChapter.content);

      // Convert cache result to SpellCheckResultDTO format
      setSpellCheckResult({
        corrections: result.data.corrections,
        correctedText: '', // Reconstructed server-side when needed
        hasErrors: result.data.hasErrors,
        summary: `${result.data.correctionCount} corrections trouvées`,
      });
    } catch (error) {
      alert('Une erreur est survenue lors de la vérification.');
      console.error(error);
      setShowSpellCheckSheet(false);
    } finally {
      setSpellCheckLoading(false);
    }
  };

  // Handle auto spell check toggle change
  const handleAutoSpellCheckChange = async (enabled: boolean) => {
    if (!project?.id) return;

    // Update local state immediately for responsive UI
    setAutoSpellCheckEnabled(enabled);

    // Persist to database
    const result = await updateAutoSpellCheck(project.id, enabled);
    if (!result.success) {
      // Revert on error
      setAutoSpellCheckEnabled(!enabled);
      alert(`Erreur: ${result.error}`);
      return;
    }

    // If enabling and no cache exists, trigger spell check
    if (enabled && spellCheckCount === 0 && !spellCheckLoading) {
      handleSpellCheckWithCache();
    }
  };

  // Detect content changes for stale indicator
  useEffect(() => {
    if (!project?.activeChapterId) return;

    const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId);
    if (!activeChapter?.content || !lastCheckedContentRef) return;

    // If content changed since last check, mark as stale
    if (activeChapter.content !== lastCheckedContentRef && spellCheckCount > 0) {
      setSpellCheckStale(true);
    }
  }, [project?.chapters, project?.activeChapterId, lastCheckedContentRef, spellCheckCount]);

  // Apply single spell check correction
  const handleApplyCorrection = async (original: string, corrected: string) => {
    if (!editor || !project?.activeChapterId) return;

    // Find and replace the text in the editor
    const content = editor.state.doc.textContent;
    const index = content.indexOf(original);
    if (index !== -1) {
      // Need to find the position in the ProseMirror document
      // This is a simplified approach - replace first occurrence
      const { state } = editor;
      let pos = 0;
      let found = false;

      state.doc.descendants((node, nodePos) => {
        if (found) return false;
        if (node.isText && node.text) {
          const textIndex = node.text.indexOf(original);
          if (textIndex !== -1) {
            pos = nodePos + textIndex;
            found = true;
            return false;
          }
        }
        return true;
      });

      if (found) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: pos, to: pos + original.length })
          .insertContent(corrected)
          .run();

        // Highlight briefly
        const newTo = pos + corrected.length;
        editor
          .chain()
          .setTextSelection({ from: pos, to: newTo })
          .setHighlight({ color: '#bbf7d0' }) // green-200
          .run();

        setTimeout(() => {
          if (editor) {
            editor
              .chain()
              .setTextSelection({ from: pos, to: newTo })
              .unsetHighlight()
              .run();
          }
        }, 2000);

        // Update cache - remove applied correction without API call
        // Need to wait a tick for editor content to update
        setTimeout(async () => {
          const activeChapter = project?.chapters.find((c) => c.id === project?.activeChapterId);
          if (activeChapter) {
            // Get updated content from editor
            const newContent = editor.getJSON();
            const newContentStr = JSON.stringify(newContent);

            const cacheResult = await updateCacheAfterCorrection(
              activeChapter.id,
              original,
              newContentStr
            );

            if (cacheResult.success && cacheResult.data) {
              setSpellCheckCount(cacheResult.data.correctionCount);
              setLastCheckedContentRef(newContentStr);
              setSpellCheckStale(false);

              // Update result to remove the applied correction
              if (spellCheckResult) {
                setSpellCheckResult({
                  ...spellCheckResult,
                  corrections: spellCheckResult.corrections.filter(
                    (c) => c.original !== original
                  ),
                  hasErrors: cacheResult.data.correctionCount > 0,
                  summary: `${cacheResult.data.correctionCount} corrections restantes`,
                });
              }
            }
          }
        }, 100);
      }
    }
  };

  // Navigate to a correction in the editor (scroll and highlight without replacing)
  const handleNavigateToCorrection = (original: string) => {
    if (!editor) return;

    const { state } = editor;
    let pos = 0;
    let found = false;

    state.doc.descendants((node, nodePos) => {
      if (found) return false;
      if (node.isText && node.text) {
        const textIndex = node.text.indexOf(original);
        if (textIndex !== -1) {
          pos = nodePos + textIndex;
          found = true;
          return false;
        }
      }
      return true;
    });

    if (found) {
      // Select the text and scroll into view
      editor
        .chain()
        .focus()
        .setTextSelection({ from: pos, to: pos + original.length })
        .scrollIntoView()
        .run();

      // Highlight temporarily
      editor
        .chain()
        .setTextSelection({ from: pos, to: pos + original.length })
        .setHighlight({ color: '#fef08a' }) // yellow-200
        .run();

      // Remove highlight after 3 seconds
      setTimeout(() => {
        if (editor) {
          editor
            .chain()
            .setTextSelection({ from: pos, to: pos + original.length })
            .unsetHighlight()
            .run();
        }
      }, 3000);
    }
  };

  // Apply all spell check corrections sequentially
  const handleApplyAllCorrections = async (
    corrections: Array<{ original: string; corrected: string }>
  ) => {
    if (!editor || !project?.activeChapterId) return;

    // Apply each correction sequentially
    for (const { original, corrected } of corrections) {
      const { state } = editor;
      let pos = 0;
      let found = false;

      state.doc.descendants((node, nodePos) => {
        if (found) return false;
        if (node.isText && node.text) {
          const textIndex = node.text.indexOf(original);
          if (textIndex !== -1) {
            pos = nodePos + textIndex;
            found = true;
            return false;
          }
        }
        return true;
      });

      if (found) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: pos, to: pos + original.length })
          .insertContent(corrected)
          .run();
      }
    }

    // Update cache after all corrections applied
    const activeChapter = project?.chapters.find((c) => c.id === project?.activeChapterId);
    if (activeChapter) {
      const newContent = editor.getJSON();
      const newContentStr = JSON.stringify(newContent);

      // Clear all corrections from cache
      for (const { original } of corrections) {
        await updateCacheAfterCorrection(activeChapter.id, original, newContentStr);
      }

      setSpellCheckCount(0);
      setLastCheckedContentRef(newContentStr);
      setSpellCheckStale(false);
      setSpellCheckResult(null);
    }

    setShowSpellCheckSheet(false);
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
      {/* Header with controls - responsive layout */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        {/* Mobile header: stacked layout */}
        <div className="flex md:hidden items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Retour aux projets" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ChaptersSheet />
          </div>
          <div className="flex-1 text-center px-2 min-w-0">
            <h1 className="text-sm font-semibold truncate">{project.title}</h1>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <SaveStatus />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DocumentControls />
            <UserMenu />
          </div>
        </div>

        {/* Desktop header: 3-column grid */}
        <div className="hidden md:grid grid-cols-3 items-center px-4 py-3">
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
            <PublishDialog projectId={project.id} projectTitle={project.title} />
            <DocumentControls />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Toolbar sticky - responsive positioning */}
      <div className="sticky top-[52px] md:top-[73px] z-40 flex justify-center py-1 md:py-2 bg-slate-50 px-2">
        <div className="w-[95%]">
          <div className="bg-white rounded-lg shadow border border-slate-200 px-1 md:px-2 py-1 overflow-x-auto">
            <FormattingToolbar
              editor={editor}
              hasSelection={hasSelection}
              onRewrite={handleRewrite}
              rewriteLoading={rewriteLoading}
              onSpellCheck={handleSpellCheckWithCache}
              spellCheckLoading={spellCheckLoading}
              spellCheckCount={spellCheckCount}
              spellCheckStale={spellCheckStale}
              autoSpellCheckEnabled={autoSpellCheckEnabled}
              onAutoSpellCheckChange={handleAutoSpellCheckChange}
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
            />
          </div>
        </div>
      </div>

      {/* Editor container - responsive width */}
      <div className="flex justify-center px-2 md:px-4 pb-8">
        <div className="w-full max-w-[794px]">
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
          providers={providers}
          selectedProviderId={selectedProviderId}
          onProviderChange={handleProviderChange}
        />
      )}

      {/* Spell check sheet */}
      <SpellCheckSheet
        open={showSpellCheckSheet}
        onOpenChange={setShowSpellCheckSheet}
        result={spellCheckResult}
        onApplyCorrection={handleApplyCorrection}
        onApplyAll={handleApplyAllCorrections}
        onNavigateToCorrection={handleNavigateToCorrection}
        loading={spellCheckLoading}
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
