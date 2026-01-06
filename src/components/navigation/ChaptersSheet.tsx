// ABOUTME: Left-side navigation sheet for chapter management with drag & drop
// ABOUTME: Displays chapter list with add/remove/reorder capabilities

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Chapter } from '@/domain/entities/Chapter';

interface ChaptersSheetProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onRemoveChapter: (chapterId: string) => void;
  onReorderChapters: (fromIndex: number, toIndex: number) => void;
}

function SortableChapterItem({
  chapter,
  isActive,
  onSelect,
  onRemove,
}: {
  chapter: Chapter;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.getId(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 border rounded-md ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      <div className="flex-1 cursor-pointer" onClick={onSelect}>
        <div className="font-medium text-sm">{chapter.getTitle()}</div>
        <div className="text-xs text-slate-500">
          {chapter.getMetadata().wordCount} mots · {chapter.getMetadata().characterCount} caractères
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ChaptersSheet({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onRemoveChapter,
  onReorderChapters,
}: ChaptersSheetProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.getId() === active.id);
    const newIndex = chapters.findIndex((c) => c.getId() === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderChapters(oldIndex, newIndex);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Chapitres">
          <FileText className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[350px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Chapitres</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Button onClick={onAddChapter} className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau chapitre
          </Button>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.getId())}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <SortableChapterItem
                    key={chapter.getId()}
                    chapter={chapter}
                    isActive={chapter.getId() === activeChapterId}
                    onSelect={() => onSelectChapter(chapter.getId())}
                    onRemove={() => onRemoveChapter(chapter.getId())}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {chapters.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Aucun chapitre. Cliquez sur &quot;Nouveau chapitre&quot; pour commencer.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
