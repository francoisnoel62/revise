// ABOUTME: Research documents page for managing project research materials
// ABOUTME: Allows creating, viewing, editing, and deleting notes, links, quotes, references

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  listResearchDocumentsAction,
  createResearchDocumentAction,
  updateResearchDocumentAction,
  deleteResearchDocumentAction,
  getResearchDocumentTagsAction,
  SerializedResearchDocument,
} from '@/app/actions/research-document-actions';
import { ResearchDocumentForm, ResearchDocumentCard } from '@/components/cockpit';
import { ResearchDocumentType } from '@/domain/entities/ResearchDocument';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

const TYPE_OPTIONS: { value: ResearchDocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les types' },
  { value: 'note', label: 'Notes' },
  { value: 'link', label: 'Liens' },
  { value: 'quote', label: 'Citations' },
  { value: 'reference', label: 'Références' },
  { value: 'image', label: 'Images' },
];

export default function ResearchPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [documents, setDocuments] = useState<SerializedResearchDocument[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<SerializedResearchDocument | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<ResearchDocumentType | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: { type?: ResearchDocumentType; tag?: string } = {};
      if (filterType !== 'all') {
        filters.type = filterType;
      }
      if (filterTag) {
        filters.tag = filterTag;
      }

      const [docsResult, tagsResult] = await Promise.all([
        listResearchDocumentsAction(projectId, filters),
        getResearchDocumentTagsAction(projectId),
      ]);

      if (docsResult.success) {
        setDocuments(docsResult.data);
      }
      if (tagsResult.success) {
        setAllTags(tagsResult.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filterType, filterTag]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: {
    type: ResearchDocumentType;
    title: string;
    url: string;
    sourceTitle: string;
    sourceAuthor: string;
    body: string;
    tags: string[];
  }) => {
    setIsCreating(true);
    try {
      const result = await createResearchDocumentAction(projectId, data.type, data.title, {
        url: data.url || undefined,
        sourceTitle: data.sourceTitle || undefined,
        sourceAuthor: data.sourceAuthor || undefined,
        content: data.body.trim() ? { text: data.body } : undefined,
        tags: data.tags,
      });

      if (result.success) {
        setDocuments((prev) => [result.data, ...prev]);
        setShowCreateForm(false);
        // Reload tags in case new ones were added
        const tagsResult = await getResearchDocumentTagsAction(projectId);
        if (tagsResult.success) {
          setAllTags(tagsResult.data);
        }
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (data: {
    type: ResearchDocumentType;
    title: string;
    url: string;
    sourceTitle: string;
    sourceAuthor: string;
    body: string;
    tags: string[];
  }) => {
    if (!editingDocument) return;

    const result = await updateResearchDocumentAction(editingDocument.id, {
      title: data.title,
      url: data.url || null,
      sourceTitle: data.sourceTitle || null,
      sourceAuthor: data.sourceAuthor || null,
      content: data.body.trim() ? { text: data.body } : null,
      tags: data.tags,
    });

    if (result.success) {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === editingDocument.id ? result.data : doc))
      );
      setEditingDocument(null);
      // Reload tags in case they changed
      const tagsResult = await getResearchDocumentTagsAction(projectId);
      if (tagsResult.success) {
        setAllTags(tagsResult.data);
      }
    } else {
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingDocumentId) return;

    const result = await deleteResearchDocumentAction(deletingDocumentId);

    if (result.success) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== deletingDocumentId));
    }

    setDeletingDocumentId(null);
  };

  const handleTagFilter = (tag: string) => {
    setFilterTag(tag === filterTag ? '' : tag);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recherches</h1>
          <p className="text-muted-foreground">
            Documentation et notes de recherche
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recherches</h1>
          <p className="text-muted-foreground">
            Documentation et notes de recherche ({documents.length})
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as ResearchDocumentType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type de document" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={filterTag === tag ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
            {filterTag && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setFilterTag('')}
              >
                Effacer filtre
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun document de recherche trouvé.</p>
          <p className="text-sm mt-1">
            Commencez par ajouter des notes, liens ou références.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <ResearchDocumentCard
              key={document.id}
              document={document}
              onEdit={setEditingDocument}
              onDelete={setDeletingDocumentId}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau document de recherche</DialogTitle>
          </DialogHeader>
          <ResearchDocumentForm
            onSubmit={handleCreate}
            isLoading={isCreating}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
          </DialogHeader>
          {editingDocument && (
            <ResearchDocumentForm
              onSubmit={handleEdit}
              initialValues={editingDocument}
              submitLabel="Enregistrer"
              onCancel={() => setEditingDocument(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingDocumentId}
        onOpenChange={() => setDeletingDocumentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
