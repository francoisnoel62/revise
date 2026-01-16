// ABOUTME: Admin page for managing blog articles
// ABOUTME: Lists all articles (including drafts) with edit/delete actions

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { listAllArticlesAction } from '@/app/actions/blog-actions';
import { getAuthenticatedAdminId } from '@/app/actions/utils';
import { BlogArticleList } from '@/components/admin/BlogArticleList';

export const metadata = {
  title: 'Gestion du blog - Admin Revise',
};

export default async function AdminBlogPage() {
  // Check admin access
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    redirect('/auth/signin');
  }

  const result = await listAllArticlesAction();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Gestion du blog</h1>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Erreur</h2>
            <p className="text-muted-foreground">{result.error}</p>
          </div>
        </main>
      </div>
    );
  }

  const articles = result.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Gestion du blog</h1>
            <div className="flex items-center gap-2">
              <Link href="/admin/blog/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel article
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aucun article pour le moment.
              </p>
              <Link href="/admin/blog/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Creer le premier article
                </Button>
              </Link>
            </div>
          ) : (
            <BlogArticleList articles={articles} />
          )}
        </div>
      </main>
    </div>
  );
}
