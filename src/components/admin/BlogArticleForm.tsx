// ABOUTME: Form component for creating and editing blog articles
// ABOUTME: Handles slug generation, markdown preview, and form validation

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import {
  createArticleAction,
  updateArticleAction,
  type CreateArticleInput,
  type UpdateArticleInput,
  type SerializedBlogArticle,
} from '@/app/actions/blog-actions';

interface BlogArticleFormProps {
  article?: SerializedBlogArticle;
  mode: 'create' | 'edit';
}

export function BlogArticleForm({ article, mode }: BlogArticleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    slug: article?.slug ?? '',
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    content: article?.content ?? '',
    readingTime: article?.readingTime ?? 5,
    isPublished: article?.isPublished ?? false,
  });

  // Auto-generate slug from title for new articles
  useEffect(() => {
    if (mode === 'create' && formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
        .slice(0, 60); // Limit length
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, formData.slug, mode]);

  // Auto-calculate reading time based on content
  useEffect(() => {
    if (formData.content) {
      const wordCount = formData.content.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      setFormData((prev) => ({ ...prev, readingTime: minutes }));
    }
  }, [formData.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        const input: CreateArticleInput = {
          slug: formData.slug,
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          readingTime: formData.readingTime,
          isPublished: formData.isPublished,
        };

        const result = await createArticleAction(input);

        if (result.success) {
          router.push('/admin/blog');
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (article) {
        const input: UpdateArticleInput = {
          slug: formData.slug !== article.slug ? formData.slug : undefined,
          title: formData.title !== article.title ? formData.title : undefined,
          excerpt:
            formData.excerpt !== article.excerpt ? formData.excerpt : undefined,
          content:
            formData.content !== article.content ? formData.content : undefined,
          readingTime:
            formData.readingTime !== article.readingTime
              ? formData.readingTime
              : undefined,
          isPublished:
            formData.isPublished !== article.isPublished
              ? formData.isPublished
              : undefined,
        };

        const result = await updateArticleAction(article.id, input);

        if (result.success) {
          router.push('/admin/blog');
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Titre de l'article"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
              }))
            }
            placeholder="url-de-l-article"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            title="Lettres minuscules, chiffres et tirets uniquement"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Resume *</Label>
        <textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          placeholder="Resume de l'article (affiche dans la liste)"
          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Contenu (Markdown) *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Masquer' : 'Apercu'}
          </Button>
        </div>

        {showPreview ? (
          <div className="min-h-[400px] p-4 rounded-md border bg-muted/50 prose prose-sm dark:prose-invert max-w-none">
            <MarkdownPreview content={formData.content} />
          </div>
        ) : (
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder="Contenu de l'article en Markdown..."
            className="w-full min-h-[400px] px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y"
            required
          />
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="space-y-2">
          <Label htmlFor="readingTime">Temps de lecture (min)</Label>
          <Input
            id="readingTime"
            type="number"
            min="1"
            value={formData.readingTime}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                readingTime: parseInt(e.target.value) || 1,
              }))
            }
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="isPublished"
            checked={formData.isPublished}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isPublished: checked }))
            }
          />
          <Label htmlFor="isPublished">Publier l&apos;article</Label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/blog')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Annuler
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting
            ? 'Enregistrement...'
            : mode === 'create'
              ? 'Creer l\'article'
              : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  if (!content) {
    return <p className="text-muted-foreground">Aucun contenu a afficher.</p>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-xl font-semibold mt-6 mb-3">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-lg font-semibold mt-4 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={key++}
          className="border-l-4 pl-4 italic text-muted-foreground my-2"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }}
        />
      );
    } else if (trimmed.startsWith('- ')) {
      elements.push(
        <li
          key={key++}
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }}
        />
      );
    } else if (trimmed === '---') {
      elements.push(<hr key={key++} className="my-4" />);
    } else {
      elements.push(
        <p
          key={key++}
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    }
  }

  return <>{elements}</>;
}
