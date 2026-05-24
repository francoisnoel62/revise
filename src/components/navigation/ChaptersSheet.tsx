// ABOUTME: Left-side navigation sheet for chapter management with drag & drop
// ABOUTME: Displays chapter list with add/remove/reorder capabilities

'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Menu } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '@/store/projectStore';
import type { SerializedChapter } from '@/store/types';

function SortableChapterItem({
  chapter,
  isActive,
  onSelect,
  onRemove,
  onUpdateTitle,
}: {
  chapter: SerializedChapter;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onUpdateTitle: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(chapter.title);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = async () => {
    if (editedTitle.trim() && editedTitle !== chapter.title) {
      await onUpdateTitle(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(chapter.title);
    setIsEditing(false);
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

      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-1">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
              className="font-medium text-sm border border-blue-500 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-slate-500">
              {chapter.metadata.wordCount} mots · {chapter.metadata.characterCount} caractères
            </div>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={onSelect}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditedTitle(chapter.title);
            }}
          >
            <div className="font-medium text-sm hover:text-blue-600">
              {chapter.title}
            </div>
            <div className="text-xs text-slate-500">
              {chapter.metadata.wordCount} mots · {chapter.metadata.characterCount} caractères
            </div>
          </div>
        )}
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

export function ChaptersSheet() {
  const [open, setOpen] = useState(false);
  const {
    project,
    isSaving,
    setActiveChapter,
    addChapter,
    removeChapter,
    reorderChapters,
    updateChapterTitle,
  } = useProjectStore();

  if (!project) return null;

  // Handle chapter click
  const handleChapterClick = async (chapterId: string) => {
    await setActiveChapter(chapterId);
  };

  // Handle add chapter
  const handleAddChapter = async () => {
    await addChapter();
  };

  // Handle delete chapter
  const handleDeleteChapter = async (chapterId: string) => {
    await removeChapter(chapterId);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !project) return;

    const oldIndex = project.chapters.findIndex((c) => c.id === active.id);
    const newIndex = project.chapters.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      await reorderChapters(oldIndex, newIndex);
    }
  };

  // Handle title update
  const handleTitleUpdate = async (chapterId: string, title: string) => {
    await updateChapterTitle(chapterId, title);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="px-2 sm:px-3">
          <Menu className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Chapitres</span>
          <span className="text-xs ml-1">({project.chapters.length})</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-87.5 sm:w-100">
        <SheetHeader>
          <SheetTitle>Chapitres</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Button
            onClick={handleAddChapter}
            className="w-full mb-4"
            disabled={isSaving}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau chapitre
          </Button>

          <ScrollArea className="h-[calc(100vh-200px)] pr-4">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={project.chapters.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {project.chapters.map((chapter) => (
                    <SortableChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      isActive={chapter.id === project.activeChapterId}
                      onSelect={() => handleChapterClick(chapter.id)}
                      onRemove={() => handleDeleteChapter(chapter.id)}
                      onUpdateTitle={(title) => handleTitleUpdate(chapter.id, title)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {project.chapters.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Aucun chapitre. Cliquez sur &quot;Nouveau chapitre&quot; pour commencer.
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
