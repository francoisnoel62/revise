// ABOUTME: Card component displaying a single metadata document.
// ABOUTME: Supports opening, renaming, deleting, and regenerating metadata.

'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MetadataListItem, deleteMetadataAction, updateMetadataTitleAction } from '@/app/actions/metadata-actions';
import type { SafeProvider } from '@/app/actions/provider-actions';

interface MetadataCardProps {
  metadata: MetadataListItem;
  onOpen: (metadataId: string) => void;
  onDeleted: (metadataId: string) => void;
  onRenamed: (metadataId: string, newTitle: string) => void;
  providers?: SafeProvider[];
  defaultProviderId?: string;
  onRegenerate?: (typeKey: string, providerId: string) => void;
  isRegenerating?: boolean;
}

export function MetadataCard({
  metadata,
  onOpen,
  onDeleted,
  onRenamed,
  providers = [],
  defaultProviderId,
  onRegenerate,
  isRegenerating = false,
}: MetadataCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(metadata.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    defaultProviderId || providers[0]?.id || ''
  );

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteMetadataAction(metadata.id);

    if (result.success) {
      onDeleted(metadata.id);
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === metadata.title) {
      setShowRenameDialog(false);
      return;
    }

    setIsRenaming(true);

    const result = await updateMetadataTitleAction(metadata.id, newTitle.trim());

    if (result.success) {
      onRenamed(metadata.id, newTitle.trim());
    }

    setIsRenaming(false);
    setShowRenameDialog(false);
  };

  const handleRegenerate = () => {
    if (onRegenerate && selectedProviderId) {
      onRegenerate(metadata.typeKey, selectedProviderId);
      setShowRegenerateDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k mots`;
    }
    return `${count} mots`;
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onOpen(metadata.id)}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate flex items-center gap-2">
              {metadata.title}
              {metadata.isGenerated && (
                <span title="Généré par IA">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </span>
              )}
            </CardTitle>
            <CardDescription className="capitalize">
              {metadata.typeKey.replace('-', ' ')}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRegenerate && providers.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProviderId(defaultProviderId || providers[0]?.id || '');
                      setShowRegenerateDialog(true);
                    }}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Régénérer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setNewTitle(metadata.title);
                  setShowRenameDialog(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatWordCount(metadata.wordCount)}</span>
            <span>{formatDate(metadata.lastEdited)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette métadonnée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement &quot;{metadata.title}&quot;.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer la métadonnée</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !newTitle.trim()}>
              {isRenaming ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Régénérer {metadata.title}
            </DialogTitle>
            <DialogDescription>
              Générer une nouvelle analyse. Cela remplacera le contenu existant.
              Toutes les modifications manuelles seront perdues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="regenerate-provider-select">AI Provider</Label>
            <Select
              value={selectedProviderId}
              onValueChange={setSelectedProviderId}
              disabled={isRegenerating}
            >
              <SelectTrigger id="regenerate-provider-select">
                <SelectValue placeholder="Sélectionner un provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} ({provider.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              disabled={isRegenerating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || !selectedProviderId}
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Régénérer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
