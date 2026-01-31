// ABOUTME: TipTap editor in a Sheet for editing editorial content
// ABOUTME: Provides rich text editing for front/back matter

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { type SerializedEditorialAnnex } from '@/app/actions/editorial-actions';
import { getEditorialPlaceholder } from '@/lib/ui-labels';
import { Loader2, Trash2 } from 'lucide-react';
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

interface EditorialEditorProps {
  annex: SerializedEditorialAnnex | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EditorialEditor({
  annex,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EditorialEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const contentSetRef = useRef(false);

  const placeholder = annex
    ? getEditorialPlaceholder(annex.type)
    : 'Commencez à écrire...';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[300px] focus:outline-none p-4 border rounded-md bg-white',
        spellcheck: 'false',
      },
    },
  });

  // Update editor content when annex changes
  useEffect(() => {
    if (editor && annex && open) {
      // Only set content once when sheet opens
      if (!contentSetRef.current) {
        if (annex.content) {
          try {
            const content = JSON.parse(annex.content);
            editor.commands.setContent(content);
          } catch {
            editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
          }
        } else {
          editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
        }
        contentSetRef.current = true;
      }
    }
  }, [editor, annex, open]);

  // Reset content set ref when sheet closes
  useEffect(() => {
    if (!open) {
      contentSetRef.current = false;
    }
  }, [open]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    setIsSaving(true);
    try {
      const content = JSON.stringify(editor.getJSON());
      await onSave(content);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave, onOpenChange]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteDialog(false);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, onOpenChange]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{annex?.title ?? 'Édition'}</SheetTitle>
            <SheetDescription>{annex?.description}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>

          <SheetFooter className="mt-6 flex-row gap-2">
            {annex?.hasContent && onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSaving || isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isDeleting}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contenu de {annex?.title?.toLowerCase()} sera définitivement supprimé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
