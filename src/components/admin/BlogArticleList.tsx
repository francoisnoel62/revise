// ABOUTME: Admin component for listing blog articles with actions
// ABOUTME: Displays article status, dates, and edit/delete buttons

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { deleteArticleAction } from '@/app/actions/blog-actions';
import type { SerializedBlogArticle } from '@/app/actions/blog-actions';

interface BlogArticleListProps {
  articles: SerializedBlogArticle[];
}

export function BlogArticleList({ articles }: BlogArticleListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const result = await deleteArticleAction(deletingId);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{article.title}</h3>
                  {article.isPublished ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                      <Eye className="h-3 w-3" />
                      Publie
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                      <EyeOff className="h-3 w-3" />
                      Brouillon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Slug: {article.slug}</span>
                  <span>
                    Modifie:{' '}
                    {new Date(article.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                  {article.publishedAt && (
                    <span>
                      Publie:{' '}
                      {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {article.isPublished && (
                  <Link
                    href={`/blog/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon" title="Voir l'article">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href={`/admin/blog/${article.id}/edit`}>
                  <Button variant="ghost" size="icon" title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Supprimer"
                  onClick={() => setDeletingId(article.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. L&apos;article sera definitivement
              supprime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
