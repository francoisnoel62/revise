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
import { listProvidersAction, SafeProvider } from '@/app/actions/provider-actions';
import { updateProjectProviderAction } from '@/app/actions/project-actions';
import { CorrectionHistoryDialog } from '@/components/history/CorrectionHistoryDialog';
import { FloatingGenerationMenu } from '@/components/editor/FloatingGenerationMenu';
import { PublishDialog } from '@/components/publish/PublishDialog';

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
      {/* Header with controls */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="grid grid-cols-3 items-center px-4 py-3">
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

      {/* Toolbar sticky centrée au-dessus de l'éditeur */}
      <div className="sticky top-18.25 z-40 flex justify-center py-2 bg-slate-50">
        <div className="w-3/4">
          <div className="bg-white rounded-lg shadow border border-slate-200 px-2 py-1">
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
            />
          </div>
        </div>
      </div>

      {/* A4 width editor container (794px = 210mm) */}
      <div className="flex justify-center pb-8">
        <div className="w-198.5">
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
