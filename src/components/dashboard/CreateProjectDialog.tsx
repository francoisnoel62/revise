// ABOUTME: Dialog for creating a new project with title and optional draft file.
// ABOUTME: Includes PDF warning dialog to inform users about AI-based text structuring.

'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
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

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (title: string, file: File | null) => Promise<void>;
  isCreating: boolean;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
  isCreating,
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPdfWarning, setShowPdfWarning] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a PDF file
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Store the file and show warning
        setPendingPdfFile(file);
        setShowPdfWarning(true);
      } else {
        // For DOCX, directly set the file
        setSelectedFile(file);
      }
    }
  };

  const handlePdfWarningConfirm = () => {
    // User confirmed, use the PDF file
    if (pendingPdfFile) {
      setSelectedFile(pendingPdfFile);
    }
    setPendingPdfFile(null);
    setShowPdfWarning(false);
  };

  const handlePdfWarningCancel = () => {
    // User cancelled, clear everything
    setPendingPdfFile(null);
    setShowPdfWarning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const projectTitle = title.trim() || 'Nouveau projet';
    await onCreateProject(projectTitle, selectedFile);

    // Reset form on success (dialog will close via parent)
    setTitle('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isCreating) {
      // Reset form when closing
      setTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
              <DialogDescription>
                Create a new writing project. You can optionally import a draft.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Title input */}
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="My novel..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              {/* File upload */}
              <div className="grid gap-2">
                <Label htmlFor="file">Draft (optional)</Label>
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isCreating}
                />

                {selectedFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleRemoveFile}
                      disabled={isCreating}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCreating}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import a .docx or .pdf file
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PDF Warning Dialog */}
      <AlertDialog open={showPdfWarning} onOpenChange={setShowPdfWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Import PDF
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>
                L&apos;import de fichiers PDF utilise l&apos;intelligence artificielle pour
                structurer le texte. Cette méthode peut ne pas être parfaite et certains
                éléments de mise en page peuvent être mal interprétés.
              </p>
              <p>
                <strong>Recommandation :</strong> Pour un meilleur contrôle de votre mise en
                page, nous vous conseillons de créer votre projet directement dans l&apos;application
                ou d&apos;utiliser le format .docx.
              </p>
              <p className="text-sm text-muted-foreground">
                Le contenu de votre texte ne sera pas modifié, seule la structure
                (paragraphes, titres) sera reconstruite par l&apos;IA.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePdfWarningCancel}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePdfWarningConfirm}>
              Continuer l&apos;import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
