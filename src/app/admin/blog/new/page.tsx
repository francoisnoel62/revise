// ABOUTME: Admin page for creating a new blog article
// ABOUTME: Uses BlogArticleForm component in create mode

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getAuthenticatedAdminId } from '@/app/actions/utils';
import { BlogArticleForm } from '@/components/admin/BlogArticleForm';

export const metadata = {
  title: 'Nouvel article - Admin Revise',
};

export default async function NewArticlePage() {
  // Check admin access
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Nouvel article</h1>
            <Link href="/admin/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour a la liste
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <BlogArticleForm mode="create" />
        </div>
      </main>
    </div>
  );
}
