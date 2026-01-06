// ABOUTME: Main application page with multi-chapter document management
// ABOUTME: Integrates all Phase 2 components with Zustand store

'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { TextEditor } from '@/components/editor/TextEditor';
import { FormattingToolbar } from '@/components/editor/FormattingToolbar';
import { ChaptersSheet } from '@/components/navigation/ChaptersSheet';
import { ProposalsSheet } from '@/components/proposals/ProposalsSheet';
import { DocumentControls } from '@/components/document/DocumentControls';
import { Switch } from '@/components/ui/switch';
import { importDocument, exportProject, rewriteText } from './actions';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Chapter } from '@/domain/entities/Chapter';
import { Project } from '@/domain/entities/Project';

interface Proposal {
  content: string;
  styleLabel?: string;
}

interface SerializedChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function HomePage() {
  // Store state
  const {
    project,
    activeContent,
    hasUnsavedChanges,
    updateActiveContent,
    setActiveChapter,
    addChapter,
    removeChapter,
    reorderChapters,
    updateChapterTitle,
    saveCurrentChapter,
    setProject,
  } = useProjectStore();

  // UI state
  const [selection, setSelection] = useState({ from: 0, to: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showProposals, setShowProposals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);

  // Editor for formatting toolbar
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [StarterKit, Bold, Italic, Underline, Highlight],
  });

  // Ref for autosave timeout
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Import handler
  const handleImport = async (formData: FormData) => {
    setImporting(true);

    try {
      const result = await importDocument(formData);

      if ('error' in result) {
        alert(`Erreur d'import: ${result.error}`);
        return;
      }

      // Reconstruct project in store
      const chapters = result.project.chapters.map(
        (chData: SerializedChapter) =>
          new Chapter(chData.id, chData.title, chData.content, chData.order)
      );

      const importedProject = new Project(chapters);
      if (result.project.activeChapterId) {
        importedProject.setActiveChapter(result.project.activeChapterId);
      }

      setProject(importedProject);
    } catch (error) {
      alert("Une erreur est survenue lors de l'import.");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  // Export handler
  const handleExport = async () => {
    setExporting(true);

    try {
      // Save current chapter first
      saveCurrentChapter();

      // Serialize project for server action
      const projectData = {
        chapters: project.getChapters().map((ch) => ({
          id: ch.getId(),
          title: ch.getTitle(),
          content: ch.getContent(),
          order: ch.getOrder(),
        })),
        activeChapterId: project.getActiveChapterId(),
      };

      const result = await exportProject(projectData);

      if ('error' in result) {
        alert(`Erreur d'export: ${result.error}`);
        return;
      }

      // Trigger download
      const buffer = new Uint8Array(result.buffer);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Une erreur est survenue lors de l'export.");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Content change handler with autosave debounce
  const handleContentChange = (content: string) => {
    updateActiveContent(content);

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for autosave (1 second)
    autosaveTimeoutRef.current = setTimeout(() => {
      saveCurrentChapter();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Autosave completed');
      }
    }, 1000);
  };

  // Selection change handler
  const handleSelectionChange = (from: number, to: number) => {
    setSelection({ from, to });
    setHasSelection(from !== to);
  };

  // Rewrite handler
  const handleRewrite = async () => {
    setLoading(true);

    try {
      const result = await rewriteText(
        activeContent,
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
      setLoading(false);
    }
  };

  // Insert proposal handler
  const handleInsert = (newText: string) => {
    // Replace text in TipTap JSON using editor commands
    if (editor) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: selection.from, to: selection.to })
        .insertContent(newText)
        .run();

      const updatedJson = editor.getJSON();
      updateActiveContent(JSON.stringify(updatedJson));
    }

    setShowProposals(false);
  };

  // Chapter selection handler
  const handleSelectChapter = (chapterId: string) => {
    // Cancel pending autosave before switching
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    if (hasUnsavedChanges) {
      // eslint-disable-next-line no-undef
      const confirmSwitch = confirm(
        'Vous avez des modifications non enregistrées. Sauvegarder avant de changer de chapitre ?'
      );
      if (confirmSwitch) {
        saveCurrentChapter();
      }
    }

    setActiveChapter(chapterId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup on chapter switch
  const activeChapterId = project.getActiveChapterId();
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [activeChapterId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full mx-auto py-8 px-4">
        {/* Header with navigation and controls */}
        <header className="flex items-center gap-4 mb-8 max-w-[80%] mx-auto">
          <div className="flex items-center gap-2">
            <Switch
              checked={chaptersOpen}
              onCheckedChange={setChaptersOpen}
              aria-label="Toggle chapters panel"
            />
            <span className="text-sm text-slate-600">Chapitres</span>
          </div>

          <ChaptersSheet
            chapters={project.getChapters()}
            activeChapterId={project.getActiveChapterId()}
            onSelectChapter={handleSelectChapter}
            onAddChapter={addChapter}
            onRemoveChapter={removeChapter}
            onReorderChapters={reorderChapters}
            onUpdateTitle={updateChapterTitle}
            open={chaptersOpen}
            onOpenChange={setChaptersOpen}
          />

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Revise</h1>
            <p className="text-slate-600 text-sm">
              {project.getActiveChapter()?.getTitle() || 'Aucun chapitre actif'}
              {hasUnsavedChanges && (
                <span className="ml-2 text-orange-600">● Non enregistré</span>
              )}
            </p>
          </div>

          <DocumentControls
            onImport={handleImport}
            onExport={handleExport}
            importing={importing}
            exporting={exporting}
          />
        </header>

        {/* 80% width editor container */}
        <div className="w-[80%] mx-auto relative">
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <FormattingToolbar
              editor={editor}
              hasSelection={hasSelection}
              onRewrite={handleRewrite}
              rewriteLoading={loading}
            />

            <TextEditor
              content={activeContent}
              onContentChange={handleContentChange}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>

        {/* Proposals Sheet */}
        <ProposalsSheet
          open={showProposals}
          proposals={proposals}
          onInsert={handleInsert}
          onClose={() => setShowProposals(false)}
        />
      </div>
    </div>
  );
}
