// ABOUTME: Server Actions for blog article management
// ABOUTME: Public reads, admin-only writes with ISR revalidation

'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  getBlogArticleRepo,
  getAuthenticatedAdminId,
  withErrorHandling,
} from './utils';
import { LoadPublishedBlogArticlesUseCase } from '@/application/use-cases/LoadPublishedBlogArticlesUseCase';
import { LoadBlogArticleBySlugUseCase } from '@/application/use-cases/LoadBlogArticleBySlugUseCase';
import { CreateBlogArticleUseCase } from '@/application/use-cases/CreateBlogArticleUseCase';
import { UpdateBlogArticleUseCase } from '@/application/use-cases/UpdateBlogArticleUseCase';
import { DeleteBlogArticleUseCase } from '@/application/use-cases/DeleteBlogArticleUseCase';
import { ListAllBlogArticlesUseCase } from '@/application/use-cases/ListAllBlogArticlesUseCase';

/**
 * Serialized blog article for client transport.
 */
export interface SerializedBlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  readingTime: number;
  isPublished: boolean;
  publishedAt: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert BlogArticle entity to serialized format.
 */
function serializeArticle(article: {
  getId(): string;
  getSlug(): string;
  getTitle(): string;
  getExcerpt(): string;
  getContent(): string;
  getReadingTime(): number;
  isPublished(): boolean;
  getPublishedAt(): Date | null;
  getAuthorId(): string;
  getCreatedAt(): Date;
  getUpdatedAt(): Date;
}): SerializedBlogArticle {
  return {
    id: article.getId(),
    slug: article.getSlug(),
    title: article.getTitle(),
    excerpt: article.getExcerpt(),
    content: article.getContent(),
    readingTime: article.getReadingTime(),
    isPublished: article.isPublished(),
    publishedAt: article.getPublishedAt()?.toISOString() ?? null,
    authorId: article.getAuthorId(),
    createdAt: article.getCreatedAt().toISOString(),
    updatedAt: article.getUpdatedAt().toISOString(),
  };
}

// ============================================
// PUBLIC ACTIONS (no authentication required)
// ============================================

/**
 * Get all published blog articles.
 * Used by the public blog list page.
 */
export async function getPublishedArticlesAction(): Promise<
  ActionResult<SerializedBlogArticle[]>
> {
  return withErrorHandling(async () => {
    const repo = await getBlogArticleRepo();
    const useCase = new LoadPublishedBlogArticlesUseCase(repo);
    const { articles } = await useCase.execute();
    return articles.map(serializeArticle);
  });
}

/**
 * Get a published blog article by slug.
 * Used by the public blog article page.
 */
export async function getArticleBySlugAction(
  slug: string
): Promise<ActionResult<SerializedBlogArticle>> {
  return withErrorHandling(async () => {
    const repo = await getBlogArticleRepo();
    const useCase = new LoadBlogArticleBySlugUseCase(repo);
    const { article } = await useCase.execute({ slug });
    return serializeArticle(article);
  });
}

// ============================================
// ADMIN ACTIONS (authentication + admin required)
// ============================================

export interface CreateArticleInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  readingTime?: number;
  isPublished?: boolean;
}

/**
 * Create a new blog article.
 * Admin only.
 */
export async function createArticleAction(
  input: CreateArticleInput
): Promise<ActionResult<SerializedBlogArticle>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    return auth.error;
  }

  const result = await withErrorHandling(async () => {
    const repo = await getBlogArticleRepo();
    const useCase = new CreateBlogArticleUseCase(repo);
    const { article } = await useCase.execute({
      ...input,
      authorId: auth.userId,
    });
    return serializeArticle(article);
  });

  // Revalidate blog pages if successful
  if (result.success) {
    revalidatePath('/blog');
    if (result.data.isPublished) {
      revalidatePath(`/blog/${result.data.slug}`);
    }
  }

  return result;
}

export interface UpdateArticleInput {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  readingTime?: number;
  isPublished?: boolean;
}

/**
 * Update an existing blog article.
 * Admin only.
 */
export async function updateArticleAction(
  articleId: string,
  input: UpdateArticleInput
): Promise<ActionResult<SerializedBlogArticle>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    return auth.error;
  }

  // Get old slug for revalidation
  const repo = await getBlogArticleRepo();
  const existingArticle = await repo.findById(articleId);
  const oldSlug = existingArticle?.getSlug();

  const result = await withErrorHandling(async () => {
    const useCase = new UpdateBlogArticleUseCase(repo);
    const { article } = await useCase.execute({
      articleId,
      ...input,
    });
    return serializeArticle(article);
  });

  // Revalidate blog pages if successful
  if (result.success) {
    revalidatePath('/blog');
    // Revalidate old slug if changed
    if (oldSlug && oldSlug !== result.data.slug) {
      revalidatePath(`/blog/${oldSlug}`);
    }
    // Revalidate new slug
    revalidatePath(`/blog/${result.data.slug}`);
  }

  return result;
}

/**
 * Delete a blog article.
 * Admin only.
 */
export async function deleteArticleAction(
  articleId: string
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    return auth.error;
  }

  // Get article slug for revalidation before deletion
  const repo = await getBlogArticleRepo();
  const article = await repo.findById(articleId);
  const slug = article?.getSlug();

  const result = await withErrorHandling(async () => {
    const useCase = new DeleteBlogArticleUseCase(repo);
    return await useCase.execute({ articleId });
  });

  // Revalidate blog pages if successful
  if (result.success) {
    revalidatePath('/blog');
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }
  }

  return result;
}

/**
 * List all blog articles (including drafts).
 * Admin only. Used by admin dashboard.
 */
export async function listAllArticlesAction(): Promise<
  ActionResult<SerializedBlogArticle[]>
> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getBlogArticleRepo();
    const useCase = new ListAllBlogArticlesUseCase(repo);
    const { articles } = await useCase.execute();
    return articles.map(serializeArticle);
  });
}

/**
 * Get a blog article by ID (includes drafts).
 * Admin only. Used by admin edit page.
 */
export async function getArticleByIdAction(
  articleId: string
): Promise<ActionResult<SerializedBlogArticle>> {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    return auth.error;
  }

  return withErrorHandling(async () => {
    const repo = await getBlogArticleRepo();
    const article = await repo.findById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }
    return serializeArticle(article);
  });
}
