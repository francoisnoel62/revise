// ABOUTME: Dialog for creating a new project with title and optional draft file/folder.
// ABOUTME: Supports .docx, .md files and folders containing .md files.

'use client';

import { useState, useRef } from 'react';
import { Upload, X, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Import data structure for project creation
 * - 'file': Single file (.docx or .md)
 * - 'folder': Folder containing .md files (each file = one chapter)
 */
export type ImportData =
  | { type: 'file'; file: File }
  | { type: 'folder'; files: File[] }
  | null;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (title: string, importData: ImportData) => Promise<void>;
  isCreating: boolean;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
  isCreating,
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [importData, setImportData] = useState<ImportData>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportData({ type: 'file', file });
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Filter to only .md files
      const mdFiles = Array.from(files).filter(f =>
        f.name.toLowerCase().endsWith('.md')
      );
      if (mdFiles.length > 0) {
        setImportData({ type: 'folder', files: mdFiles });
      }
    }
  };

  const handleRemoveImport = () => {
    setImportData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const projectTitle = title.trim() || 'Nouveau projet';
    await onCreateProject(projectTitle, importData);

    // Reset form on success (dialog will close via parent)
    setTitle('');
    setImportData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isCreating) {
      // Reset form when closing
      setTitle('');
      setImportData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
    onOpenChange(newOpen);
  };

  const getImportDisplayName = (): string => {
    if (!importData) return '';
    if (importData.type === 'file') {
      return importData.file.name;
    }
    // For folder, show count of .md files
    return `${importData.files.length} fichier${importData.files.length > 1 ? 's' : ''} .md`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Créez un nouveau projet d&apos;écriture. Vous pouvez importer un brouillon.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title input */}
            <div className="grid gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Mon roman..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* File/Folder upload */}
            <div className="grid gap-2">
              <Label>Brouillon (optionnel)</Label>
              {/* Hidden file input for single files */}
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".docx,.md"
                onChange={handleFileChange}
                className="hidden"
                disabled={isCreating}
              />
              {/* Hidden folder input */}
              <input
                ref={folderInputRef}
                id="folder"
                type="file"
                // @ts-expect-error webkitdirectory is a non-standard attribute
                webkitdirectory=""
                onChange={handleFolderChange}
                className="hidden"
                disabled={isCreating}
              />

              {importData ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  {importData.type === 'folder' ? (
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="flex-1 text-sm truncate">{getImportDisplayName()}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleRemoveImport}
                    disabled={isCreating}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Supprimer l&apos;import</span>
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCreating}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Fichier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isCreating}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Dossier .md
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formats acceptés : .docx, .md ou dossier de fichiers .md
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
