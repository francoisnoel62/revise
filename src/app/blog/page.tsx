// ABOUTME: Page de liste des articles du blog avec pagination
// ABOUTME: Affiche 5 articles par page depuis MongoDB avec ISR

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, ArrowRight, Eye } from 'lucide-react';
import { getPublishedArticlesPaginatedAction } from '@/app/actions/blog-actions';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export const metadata = {
  title: 'Blog - Revise',
  description:
    "Conseils d'écriture et techniques narratives pour les auteurs de fiction",
};

// Revalidate every hour for ISR
export const revalidate = 3600;

const ARTICLES_PER_PAGE = 5;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * Generate pagination links with ellipsis for large page counts.
 */
function generatePaginationItems(currentPage: number, totalPages: number) {
  const items: (number | 'ellipsis')[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
  } else {
    items.push(1);

    if (currentPage > 3) {
      items.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (currentPage < totalPages - 2) {
      items.push('ellipsis');
    }

    items.push(totalPages);
  }

  return items;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));

  const result = await getPublishedArticlesPaginatedAction(
    currentPage,
    ARTICLES_PER_PAGE
  );

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">Revise</span>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-12 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold mb-4">Erreur</h1>
            <p className="text-muted-foreground">{result.error}</p>
          </div>
        </main>
      </div>
    );
  }

  const { items: articles, totalPages, hasNextPage, hasPreviousPage } = result.data;
  const paginationItems = generatePaginationItems(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Conseils d&apos;écriture et techniques narratives pour les auteurs
            de fiction
          </p>

          {articles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Aucun article disponible pour le moment.
            </p>
          ) : (
            <>
              <div className="space-y-8">
                {articles.map((article) => (
                  <article
                    key={article.slug}
                    className="group border rounded-lg p-6 hover:border-primary/50 transition-colors"
                  >
                    <Link href={`/blog/${article.slug}`}>
                      <h2 className="text-xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString(
                                'fr-FR',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )
                            : 'Non publié'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.readingTime} min de lecture
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.viewCount} {article.viewCount === 1 ? 'vue' : 'vues'}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center text-primary text-sm font-medium">
                        Lire l&apos;article
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-12">
                  <PaginationContent>
                    {hasPreviousPage && (
                      <PaginationItem>
                        <PaginationPrevious
                          href={
                            currentPage === 2
                              ? '/blog'
                              : `/blog?page=${currentPage - 1}`
                          }
                        />
                      </PaginationItem>
                    )}

                    {paginationItems.map((item, index) =>
                      item === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href={item === 1 ? '/blog' : `/blog?page=${item}`}
                            isActive={item === currentPage}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    {hasNextPage && (
                      <PaginationItem>
                        <PaginationNext href={`/blog?page=${currentPage + 1}`} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
