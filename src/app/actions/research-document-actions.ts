// ABOUTME: Server actions for research document CRUD operations
// ABOUTME: Provides API for creating, listing, updating, and deleting research documents

'use server';

import {
  getAuthenticatedUserId,
  getResearchDocumentRepo,
  getIdGenerator,
  withErrorHandling,
  type ActionResult,
} from './utils';
import { CreateResearchDocumentUseCase } from '@/application/use-cases/CreateResearchDocumentUseCase';
import { ListResearchDocumentsUseCase } from '@/application/use-cases/ListResearchDocumentsUseCase';
import { UpdateResearchDocumentUseCase } from '@/application/use-cases/UpdateResearchDocumentUseCase';
import { DeleteResearchDocumentUseCase } from '@/application/use-cases/DeleteResearchDocumentUseCase';
import { ResearchDocument, ResearchDocumentType } from '@/domain/entities/ResearchDocument';

export interface SerializedResearchDocument {
  id: string;
  projectId: string;
  type: ResearchDocumentType;
  title: string;
  content: Record<string, unknown> | null;
  url: string | null;
  sourceTitle: string | null;
  sourceAuthor: string | null;
  tags: string[];
  linkedChapterIds: string[];
  createdAt: string;
  updatedAt: string;
}

function serializeDocument(doc: ResearchDocument): SerializedResearchDocument {
  return {
    id: doc.getId(),
    projectId: doc.getProjectId(),
    type: doc.getType(),
    title: doc.getTitle(),
    content: doc.getContent(),
    url: doc.getUrl(),
    sourceTitle: doc.getSourceTitle(),
    sourceAuthor: doc.getSourceAuthor(),
    tags: doc.getTags(),
    linkedChapterIds: doc.getLinkedChapterIds(),
    createdAt: doc.getCreatedAt().toISOString(),
    updatedAt: doc.getUpdatedAt().toISOString(),
  };
}

export async function createResearchDocumentAction(
  projectId: string,
  type: ResearchDocumentType,
  title: string,
  options?: {
    content?: Record<string, unknown>;
    url?: string;
    sourceTitle?: string;
    sourceAuthor?: string;
    tags?: string[];
    linkedChapterIds?: string[];
  }
): Promise<ActionResult<SerializedResearchDocument>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CreateResearchDocumentUseCase(
      await getResearchDocumentRepo(),
      await getIdGenerator()
    );

    const document = await useCase.execute({
      userId: auth.userId,
      projectId,
      type,
      title,
      ...options,
    });

    return serializeDocument(document);
  });
}

export async function listResearchDocumentsAction(
  projectId: string,
  filters?: {
    type?: ResearchDocumentType;
    tag?: string;
    linkedChapterId?: string;
  }
): Promise<ActionResult<SerializedResearchDocument[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ListResearchDocumentsUseCase(await getResearchDocumentRepo());

    const documents = await useCase.execute({
      userId: auth.userId,
      projectId,
      type: filters?.type,
      tag: filters?.tag,
      linkedChapterId: filters?.linkedChapterId,
    });

    return documents.map(serializeDocument);
  });
}

export async function updateResearchDocumentAction(
  documentId: string,
  updates: {
    title?: string;
    content?: Record<string, unknown> | null;
    url?: string | null;
    sourceTitle?: string | null;
    sourceAuthor?: string | null;
    tags?: string[];
    linkedChapterIds?: string[];
  }
): Promise<ActionResult<SerializedResearchDocument>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UpdateResearchDocumentUseCase(await getResearchDocumentRepo());

    const document = await useCase.execute({
      userId: auth.userId,
      documentId,
      ...updates,
    });

    return serializeDocument(document);
  });
}

export async function deleteResearchDocumentAction(
  documentId: string
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new DeleteResearchDocumentUseCase(await getResearchDocumentRepo());

    await useCase.execute({
      userId: auth.userId,
      documentId,
    });
  });
}

export async function getResearchDocumentTagsAction(
  projectId: string
): Promise<ActionResult<string[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getResearchDocumentRepo();
    return repo.getAllTags(auth.userId, projectId);
  });
}

export async function getResearchDocumentCountAction(
  projectId: string
): Promise<ActionResult<number>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getResearchDocumentRepo();
    return repo.countByProjectId(auth.userId, projectId);
  });
}
