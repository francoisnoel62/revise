// ABOUTME: Dialog for creating a new project with title and optional draft file.
// ABOUTME: Used in dashboard to provide a better project creation UX.

'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
  );
}
