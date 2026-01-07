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
import { ChaptersSheet } from '@/components/navigation/ChaptersSheet';
import { ProposalsSheet } from '@/components/proposals/ProposalsSheet';
import { DocumentControls } from '@/components/document/DocumentControls';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Editor } from '@tiptap/react';
import { rewriteText } from './actions';

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
    createProject,
  } = useProjectStore();

  // UI state for proposals
  const [selection, setSelection] = useState({ from: 0, to: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showProposals, setShowProposals] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Track initialization to prevent infinite loop
  const initializedRef = useRef(false);
  const currentProjectIdRef = useRef<string | null>(null);

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
      } else if (!project && !initializedRef.current) {
        // Create new project if none loaded
        initializedRef.current = true;
        const newProjectId = await createProject();
        if (newProjectId) {
          currentProjectIdRef.current = newProjectId;
          // Update URL with project ID
          router.replace(`/?project=${newProjectId}`);
        }
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

  // Selection change handler
  const handleSelectionChange = (from: number, to: number) => {
    setSelection({ from, to });
    setHasSelection(from !== to);
  };

  // Rewrite handler
  const handleRewrite = async () => {
    if (!project?.activeChapterId) return;

    setRewriteLoading(true);

    try {
      const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId);
      if (!activeChapter) return;

      const result = await rewriteText(
        activeChapter.content,
        selection.from,
        selection.to
      );

      if ('error' in result) {
        alert(`Erreur: ${result.error}`);
        return;
      }

      setProposals(result.proposals);
      setShowProposals(true);

      // Performance warning
      if (result.duration && result.duration > 3000) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ Performance target exceeded: ${result.duration.toFixed(0)}ms`
          );
        }
      }
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
          <p className="text-muted-foreground">Loading project...</p>
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
            onClick={() => router.push('/')}
            className="text-primary underline"
          >
            Create New Project
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
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Back to projects">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ChaptersSheet />
            <div>
              <h1 className="text-lg font-semibold">
                {project.chapters.find((c) => c.id === project.activeChapterId)?.title || 'Untitled'}
              </h1>
              <SaveStatus />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FormattingToolbar
              editor={editor}
              hasSelection={hasSelection}
              onRewrite={handleRewrite}
              rewriteLoading={rewriteLoading}
            />
            <DocumentControls />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* A4 width editor container (794px = 210mm) */}
      <div className="flex justify-center py-8">
        <div className="w-[794px]">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <TextEditor
              onSelectionChange={handleSelectionChange}
              onEditorReady={(editorInstance) => setEditor(editorInstance)}
            />
          </div>
        </div>
      </div>

      {/* Proposals panel */}
      <ProposalsSheet
        open={showProposals}
        proposals={proposals}
        onInsert={handleInsert}
        onClose={() => setShowProposals(false)}
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
