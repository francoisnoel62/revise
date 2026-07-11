// ABOUTME: Manages author-inserted custom annexes: add, edit (TipTap), reorder, delete.
// ABOUTME: Annexes are grouped into two zones — début (liminaires) and fin (back matter).

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createCustomAnnexAction,
  deleteCustomAnnexAction,
  listCustomAnnexesAction,
  reorderCustomAnnexesAction,
  updateCustomAnnexAction,
  type SerializedCustomAnnex,
} from '@/app/actions/custom-annex-actions';
import type { AnnexPlacement } from '@/domain/entities/CustomAnnex';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

const ZONES: { placement: AnnexPlacement; label: string; hint: string }[] = [
  { placement: 'front', label: 'Début du livre', hint: 'Liminaires, après les pages de titre' },
  { placement: 'back', label: 'Fin du livre', hint: 'Après le corps, avant les mentions légales' },
];

function SortableAnnexRow({
  annex,
  onEdit,
  onDelete,
}: {
  annex: SerializedCustomAnnex;
  onEdit: (annex: SerializedCustomAnnex) => void;
  onDelete: (annex: SerializedCustomAnnex) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: annex.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border rounded-md bg-white hover:bg-slate-50"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      <span className="flex-1 truncate font-medium">{annex.title}</span>
      {annex.hasContent ? (
        <Badge variant="secondary" className="shrink-0">
          <Check className="h-3 w-3 mr-1" />
          Rédigé
        </Badge>
      ) : (
        <Badge variant="outline" className="shrink-0 text-muted-foreground">
          À rédiger
        </Badge>
      )}
      <Button variant="outline" size="sm" onClick={() => onEdit(annex)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(annex)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function CustomAnnexEditor({
  annex,
  open,
  onOpenChange,
  onSave,
}: {
  annex: SerializedCustomAnnex | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, content: string) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Rédigez votre annexe...' })],
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

  useEffect(() => {
    if (!editor || !annex || !open) return;
    setTitle(annex.title);
    try {
      editor.commands.setContent(JSON.parse(annex.content));
    } catch {
      editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
    }
    // Re-seed only when a different annex opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, annex?.id, open]);

  const handleSave = useCallback(async () => {
    if (!editor || !title.trim()) return;
    setIsSaving(true);
    try {
      await onSave(title.trim(), JSON.stringify(editor.getJSON()));
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [editor, title, onSave, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Annexe personnalisée</SheetTitle>
          <SheetDescription>Titre et contenu affichés dans votre livre.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="annex-title">Titre</Label>
            <Input
              id="annex-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Présentation de Revise Studio"
            />
          </div>
          <EditorContent editor={editor} />
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function CustomAnnexSection({ projectId }: { projectId: string }) {
  const [annexes, setAnnexes] = useState<SerializedCustomAnnex[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPlacement, setNewPlacement] = useState<AnnexPlacement>('back');
  const [editing, setEditing] = useState<SerializedCustomAnnex | null>(null);

  const load = useCallback(async () => {
    const result = await listCustomAnnexesAction(projectId);
    if (result.success) setAnnexes(result.data);
    else setError(result.error);
  }, [projectId]);

  useEffect(() => {
    // Fetch-on-mount: load() only setState()s after its await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const result = await createCustomAnnexAction(projectId, newTitle.trim(), newPlacement);
    if (result.success) {
      setAnnexes((prev) => [...prev, result.data]);
      setAddOpen(false);
      setNewTitle('');
      setEditing(result.data); // open the editor straight away
    } else {
      setError(result.error);
    }
  };

  const handleSaveContent = async (title: string, content: string) => {
    if (!editing) return;
    const result = await updateCustomAnnexAction(projectId, editing.id, { title, content });
    if (result.success) {
      setAnnexes((prev) => prev.map((a) => (a.id === result.data.id ? result.data : a)));
    } else {
      throw new Error(result.error);
    }
  };

  const handleDelete = async (annex: SerializedCustomAnnex) => {
    const result = await deleteCustomAnnexAction(projectId, annex.id);
    if (result.success) {
      setAnnexes((prev) => prev.filter((a) => a.id !== annex.id));
    } else {
      setError(result.error);
    }
  };

  const handleDragEnd = async (placement: AnnexPlacement, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const zone = annexes.filter((a) => a.placement === placement);
    const oldIndex = zone.findIndex((a) => a.id === active.id);
    const newIndex = zone.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(zone, oldIndex, newIndex);
    const others = annexes.filter((a) => a.placement !== placement);
    setAnnexes([...others, ...reordered.map((a, i) => ({ ...a, order: i }))]);

    const result = await reorderCustomAnnexesAction(
      projectId,
      placement,
      reordered.map((a) => a.id),
    );
    if (!result.success) {
      setError(result.error);
      load(); // resync on failure
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Annexes personnalisées</h2>
          <p className="text-sm text-muted-foreground">
            Ajoutez vos propres pages et choisissez où les insérer dans le livre.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une annexe
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {ZONES.map(({ placement, label, hint }) => {
        const zone = annexes
          .filter((a) => a.placement === placement)
          .sort((a, b) => a.order - b.order);
        return (
          <div key={placement} className="space-y-2">
            <div>
              <h3 className="text-sm font-medium">{label}</h3>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            {zone.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucune annexe.</p>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(placement, e)}>
                <SortableContext items={zone.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {zone.map((annex) => (
                      <SortableAnnexRow
                        key={annex.id}
                        annex={annex}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      })}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une annexe</DialogTitle>
            <DialogDescription>Donnez-lui un titre et choisissez son emplacement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="new-annex-title">Titre</Label>
              <Input
                id="new-annex-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Présentation de Revise Studio"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Emplacement</Label>
              <div className="flex gap-2">
                {ZONES.map(({ placement, label }) => (
                  <Button
                    key={placement}
                    type="button"
                    variant={newPlacement === placement ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setNewPlacement(placement)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomAnnexEditor
        annex={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={handleSaveContent}
      />
    </div>
  );
}
