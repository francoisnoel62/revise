// ABOUTME: Component for uploading cover images
// ABOUTME: Handles preview, upload, and deletion of cover images

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Loader2 } from 'lucide-react';

interface CoverImageUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  isUploading?: boolean;
  isDeleting?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function CoverImageUpload({
  currentImageUrl,
  onUpload,
  onDelete,
  isUploading = false,
  isDeleting = false,
}: CoverImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format non supporté. Utilisez JPEG, PNG ou WebP.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`Fichier trop volumineux. Taille max: ${MAX_SIZE_MB} Mo.`);
      return;
    }

    // Show preview
    const reader = new globalThis.FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await onUpload(file);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      setPreviewUrl(null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      <Label>Couverture</Label>

      <div className="flex items-start gap-4">
        {/* Image preview */}
        <div className="relative w-32 h-48 bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Couverture"
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-xs text-center px-2">
              Ratio 2:3 recommandé
            </span>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            id="cover-upload"
            disabled={isUploading || isDeleting}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {currentImageUrl ? 'Changer' : 'Ajouter'}
          </Button>

          {currentImageUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP • Max {MAX_SIZE_MB} Mo
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
