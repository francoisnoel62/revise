// ABOUTME: Public reader component for viewing shared projects.
// ABOUTME: Displays TipTap content in read-only mode with chapter navigation.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import TextAlign from '@tiptap/extension-text-align';
import { IndentParagraph } from '@/components/editor/extensions/IndentParagraph';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, BookOpen, Menu, X } from 'lucide-react';
import { PublicProject, PublicChapter } from '@/app/actions/publish-actions';
import { cn } from '@/lib/utils';

interface PublicReaderProps {
  project: PublicProject;
}

export function PublicReader({ project }: PublicReaderProps) {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showChapterList, setShowChapterList] = useState(false);

  const activeChapter = project.chapters[activeChapterIndex];
  const totalWords = project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        paragraph: false,
      }),
      IndentParagraph,
      Highlight.configure({ multicolor: true }),
      TextStyle,
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
    ],
    content: activeChapter ? JSON.parse(activeChapter.content) : { type: 'doc', content: [] },
  });

  const goToChapter = (index: number) => {
    if (index >= 0 && index < project.chapters.length) {
      setActiveChapterIndex(index);
      const chapter = project.chapters[index];
      editor?.commands.setContent(JSON.parse(chapter.content));
      setShowChapterList(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasPrevious = activeChapterIndex > 0;
  const hasNext = activeChapterIndex < project.chapters.length - 1;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowChapterList(!showChapterList)}
              >
                {showChapterList ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Link href="/" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold">Revise</span>
              </Link>
            </div>

            <div className="flex-1 text-center hidden sm:block">
              <h1 className="font-medium truncate max-w-md mx-auto">{project.title}</h1>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                {totalWords.toLocaleString('fr-FR')} mots
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Chapter List - Sidebar */}
        <aside
          className={cn(
            'fixed md:sticky top-14 left-0 z-40 w-72 h-[calc(100vh-3.5rem)] bg-white border-r transition-transform duration-200 ease-in-out',
            showChapterList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Table des matières
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-7rem)]">
            <nav className="p-2">
              {project.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(index)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    index === activeChapterIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="font-medium truncate">{chapter.title}</div>
                  <div className="text-xs opacity-70">
                    {chapter.wordCount.toLocaleString('fr-FR')} mots
                  </div>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Overlay for mobile */}
        {showChapterList && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setShowChapterList(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 py-8 px-4">
          {/* Chapter Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-medium text-gray-800">
              {activeChapter?.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Chapitre {activeChapterIndex + 1} sur {project.chapters.length}
            </p>
          </div>

          {/* Reader Content */}
          <div className="max-w-[794px] mx-auto">
            <div className="editor-a4-page reader-mode">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Chapter Navigation */}
          <div className="max-w-[794px] mx-auto mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => goToChapter(activeChapterIndex - 1)}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Chapitre précédent
            </Button>

            <span className="text-sm text-muted-foreground">
              {activeChapterIndex + 1} / {project.chapters.length}
            </span>

            <Button
              variant="outline"
              onClick={() => goToChapter(activeChapterIndex + 1)}
              disabled={!hasNext}
            >
              Chapitre suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
