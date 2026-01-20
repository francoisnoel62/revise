// ABOUTME: Page dynamique pour afficher un article de blog
// ABOUTME: Charge l'article par son slug depuis MongoDB avec ISR

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import {
  getArticleBySlugAction,
  getPublishedArticlesAction,
} from '@/app/actions/blog-actions';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Revalidate every hour for ISR
export const revalidate = 3600;

// Allow dynamic rendering for slugs not generated at build time
export const dynamicParams = true;

export async function generateStaticParams() {
  const result = await getPublishedArticlesAction();
  if (!result.success) {
    return [];
  }
  return result.data.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getArticleBySlugAction(slug);

  if (!result.success) {
    return {
      title: 'Article non trouvé - Revise',
    };
  }

  return {
    title: `${result.data.title} - Blog Revise`,
    description: result.data.excerpt,
  };
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let _inBlockquote = false;
  let _inList = false;
  let listItems: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      if (text.trim()) {
        elements.push(
          <p
            key={key++}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }}
          />
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 mb-4 space-y-1">
          {listItems.map((item, i) => (
            <li
              key={i}
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }}
            />
          ))}
        </ul>
      );
      listItems = [];
      _inList = false;
    }
  };

  const formatInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
      );
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Empty line
    if (!trimmedLine) {
      flushParagraph();
      flushList();
      _inBlockquote = false;
      continue;
    }

    // Heading 2
    if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h2 key={key++} className="text-2xl font-semibold mt-8 mb-4">
          {trimmedLine.slice(3)}
        </h2>
      );
      continue;
    }

    // Heading 3
    if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={key++} className="text-xl font-semibold mt-6 mb-3">
          {trimmedLine.slice(4)}
        </h3>
      );
      continue;
    }

    // Horizontal rule
    if (trimmedLine === '---') {
      flushParagraph();
      flushList();
      elements.push(<hr key={key++} className="my-8 border-border" />);
      continue;
    }

    // Blockquote
    if (trimmedLine.startsWith('> ')) {
      flushParagraph();
      flushList();
      const quoteText = trimmedLine.slice(2);
      elements.push(
        <blockquote
          key={key++}
          className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(quoteText) }}
        />
      );
      _inBlockquote = true;
      continue;
    }

    // List item
    if (trimmedLine.startsWith('- ')) {
      flushParagraph();
      _inList = true;
      listItems.push(trimmedLine.slice(2));
      continue;
    }

    // Regular paragraph
    flushList();
    currentParagraph.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  return elements;
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getArticleBySlugAction(slug);

  if (!result.success) {
    notFound();
  }

  const article = result.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise</span>
            </Link>
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au blog
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <article className="mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : article.isPublished
                    ? new Date(article.updatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Non publié'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.readingTime} min de lecture
              </span>
            </div>
          </header>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            {renderMarkdown(article.content)}
          </div>

          <footer className="mt-12 pt-8 border-t">
            <Link href="/blog">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voir tous les articles
              </Button>
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
