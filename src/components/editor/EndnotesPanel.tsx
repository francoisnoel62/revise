// ABOUTME: Read-only sheet listing every endnote of the project, grouped by chapter and numbered as at export.
// ABOUTME: Open state is controlled by the host page, not by this component, so it can later survive a chapter switch.

'use client';

import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { buildEndnoteIndex, type BuildEndnoteIndexInput } from '@/application/services/endnoteIndex';

interface EndnotesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapters: BuildEndnoteIndexInput['chapters'];
  activeChapterId: string | null;
  activeContent: string | null;
  /** Only ever called for a note of the active chapter — other chapters aren't actionable yet. */
  onEditNote?: (chapterId: string, rank: number) => void;
  onDeleteNote?: (chapterId: string, rank: number) => void;
}

export function EndnotesPanel({
  open,
  onOpenChange,
  chapters,
  activeChapterId,
  activeContent,
  onEditNote,
  onDeleteNote,
}: EndnotesPanelProps) {
  const index = useMemo(
    () => buildEndnoteIndex({ chapters, activeChapterId, activeContent }),
    [chapters, activeChapterId, activeContent]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-87.5 sm:w-100">
        <SheetHeader>
          <SheetTitle>Liste des notes</SheetTitle>
        </SheetHeader>

        <ScrollArea className="mt-2 h-[calc(100vh-120px)] pr-4">
          {index.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground italic">
              Aucune note dans ce projet.
            </p>
          ) : (
            <div className="space-y-6 px-4 pb-4">
              {index.map((chapter) => {
                const isActiveChapter = chapter.chapterId === activeChapterId;
                return (
                  <div key={chapter.chapterId}>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      {chapter.chapterTitle}
                      {isActiveChapter && (
                        <Badge variant="secondary">Chapitre actif</Badge>
                      )}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {chapter.notes.map((note) => (
                        <div
                          key={`${chapter.chapterId}-${note.rank}`}
                          className="flex items-start gap-2 p-2 border rounded-md bg-white"
                        >
                          <Badge variant="outline" className="shrink-0 mt-0.5">
                            {note.rank}
                          </Badge>
                          <p
                            className="text-sm line-clamp-2 flex-1"
                            title={note.text}
                          >
                            {note.isEmpty ? 'Note vide' : note.preview}
                          </p>
                          {isActiveChapter && onEditNote && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              aria-label={`Modifier la note ${note.rank} — ${chapter.chapterTitle}`}
                              onClick={() => onEditNote(chapter.chapterId, note.rank)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {isActiveChapter && onDeleteNote && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              aria-label={`Supprimer la note ${note.rank} — ${chapter.chapterTitle}`}
                              onClick={() => onDeleteNote(chapter.chapterId, note.rank)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
