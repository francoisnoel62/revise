// ABOUTME: Dialog for publishing and sharing a project with chapter selection.
// ABOUTME: Allows users to choose which chapters to publish and generate a shareable link.

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Link2, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  publishProjectAction,
  unpublishProjectAction,
  getPublishStatusAction,
} from '@/app/actions/publish-actions';

interface Chapter {
  id: string;
  title: string;
  order: number;
  metadata: {
    wordCount: number;
  };
}

interface PublishDialogProps {
  projectId: string;
  projectTitle: string;
  chapters: Chapter[];
}

export function PublishDialog({ projectId, projectTitle, chapters }: PublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [publishedChapterIds, setPublishedChapterIds] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chapter selection state (for unpublished projects)
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());

  // Ref to access current chapters without causing re-renders
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => a.order - b.order);
  }, [chapters]);

  // Load publish status without resetting selection
  const loadPublishStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPublishStatusAction(projectId);
      if (result.success) {
        setIsPublished(result.data.isPublished);
        setShareUrl(result.data.shareUrl);
        setPublishedChapterIds(result.data.publishedChapterIds);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch {
      setError('Erreur lors du chargement du statut');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load publish status on mount to show correct button label
  useEffect(() => {
    loadPublishStatus();
  }, [loadPublishStatus]);

  // Initialize selection when dialog opens (like ExportDialog pattern)
  const handleOpenChange = useCallback(async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const status = await loadPublishStatus();
      console.log('[PublishDialog] handleOpenChange:', {
        status,
        chaptersRefLength: chaptersRef.current.length,
        chaptersRef: chaptersRef.current.map(c => ({ id: c.id, title: c.title })),
      });
      // Initialize selection based on current published state
      if (status) {
        if (status.publishedChapterIds) {
          console.log('[PublishDialog] Setting selection from publishedChapterIds:', status.publishedChapterIds);
          setSelectedChapterIds(new Set(status.publishedChapterIds));
        } else {
          // All chapters are published or not published yet, select all
          console.log('[PublishDialog] Setting selection to all chapters');
          setSelectedChapterIds(new Set(chaptersRef.current.map((ch) => ch.id)));
        }
      }
    }
  }, [loadPublishStatus]);

  const toggleChapter = (chapterId: string) => {
    console.log('[PublishDialog] toggleChapter:', chapterId);
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      console.log('[PublishDialog] After toggle, selectedChapterIds:', Array.from(next));
      return next;
    });
  };

  const selectAll = () => {
    setSelectedChapterIds(new Set(chaptersRef.current.map((ch) => ch.id)));
  };

  const deselectAll = () => {
    setSelectedChapterIds(new Set());
  };

  const allSelected = selectedChapterIds.size === chapters.length;
  const noneSelected = selectedChapterIds.size === 0;

  const handlePublish = async () => {
    if (noneSelected) return;

    setIsLoading(true);
    setError(null);
    try {
      const chapterIds = Array.from(selectedChapterIds);
      console.log('[PublishDialog] handlePublish:', {
        selectedChapterIds: chapterIds,
        selectedCount: chapterIds.length,
        totalChapters: chapters.length,
        chaptersRefLength: chaptersRef.current.length,
        allSelected,
        passingUndefined: allSelected,
        chaptersFromProp: chapters.map(c => ({ id: c.id, title: c.title })),
      });
      // Pass undefined if all chapters are selected
      const result = await publishProjectAction(
        projectId,
        allSelected ? undefined : chapterIds
      );
      if (result.success) {
        setIsPublished(true);
        setShareUrl(result.data.shareUrl);
        setPublishedChapterIds(result.data.publishedChapterIds);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Erreur lors de la publication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unpublishProjectAction(projectId);
      if (result.success) {
        setIsPublished(false);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Erreur lors de la dépublication');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Impossible de copier le lien');
    }
  };

  // Get published chapter count for display
  const publishedChapterCount = publishedChapterIds
    ? publishedChapterIds.length
    : chapters.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
          {isPublished ? (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Publié</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Publier</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Partager publiquement
          </DialogTitle>
          <DialogDescription>
            Partagez votre projet avec un lien public. Seules les personnes ayant le lien pourront
            le lire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Title */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{projectTitle}</p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isPublished ? (
            <>
              {/* Published State */}
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Eye className="h-4 w-4" />
                <span>
                  Votre projet est publié ({publishedChapterCount} chapitre
                  {publishedChapterCount > 1 ? 's' : ''})
                </span>
              </div>

              {/* Share Link */}
              <div className="space-y-2">
                <Label htmlFor="share-link">Lien de partage</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareUrl || ''}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview Link */}
              {shareUrl && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <Link2 className="h-4 w-4" />
                    Voir la page publique
                  </a>
                </Button>
              )}

              {/* Unpublish Button */}
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleUnpublish}
                disabled={isLoading}
              >
                <EyeOff className="h-4 w-4" />
                Retirer de la publication
              </Button>
            </>
          ) : (
            <>
              {/* Unpublished State */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                <span>Votre projet n&apos;est pas publié</span>
              </div>

              {/* Chapter Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Chapitres à publier</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={allSelected}
                      className="h-7 text-xs"
                    >
                      Tout
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      disabled={noneSelected}
                      className="h-7 text-xs"
                    >
                      Aucun
                    </Button>
                  </div>
                </div>

                <div className="max-h-64 sm:max-h-80 overflow-y-auto rounded-lg border p-2 space-y-1">
                  {sortedChapters.map((chapter) => (
                    <label
                      key={chapter.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedChapterIds.has(chapter.id)}
                        onCheckedChange={() => toggleChapter(chapter.id)}
                      />
                      <span className="text-sm flex-1 truncate">{chapter.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {chapter.metadata.wordCount} mots
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  {selectedChapterIds.size} chapitre{selectedChapterIds.size > 1 ? 's' : ''}{' '}
                  sélectionné{selectedChapterIds.size > 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium text-sm">En publiant votre projet :</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    Un lien unique sera généré
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    Seules les personnes avec le lien pourront lire
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    Vous pouvez retirer la publication à tout moment
                  </li>
                </ul>
              </div>

              {/* Publish Button */}
              <Button
                className="w-full gap-2"
                onClick={handlePublish}
                disabled={isLoading || noneSelected}
              >
                <Globe className="h-4 w-4" />
                Publier {selectedChapterIds.size} chapitre
                {selectedChapterIds.size > 1 ? 's' : ''}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
