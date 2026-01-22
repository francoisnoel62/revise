// ABOUTME: Use case for creating a new research document
// ABOUTME: Validates input and delegates to repository

import { ResearchDocument, ResearchDocumentType } from '@/domain/entities/ResearchDocument';
import { ResearchDocumentRepository } from '@/domain/interfaces/ResearchDocumentRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateResearchDocumentInput {
  userId: string;
  projectId: string;
  type: ResearchDocumentType;
  title: string;
  content?: Record<string, unknown>;
  url?: string;
  sourceTitle?: string;
  sourceAuthor?: string;
  tags?: string[];
  linkedChapterIds?: string[];
}

export class CreateResearchDocumentUseCase {
  constructor(
    private readonly repository: ResearchDocumentRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateResearchDocumentInput): Promise<ResearchDocument> {
    const document = ResearchDocument.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.type,
      input.title,
      {
        content: input.content,
        url: input.url,
        sourceTitle: input.sourceTitle,
        sourceAuthor: input.sourceAuthor,
        tags: input.tags,
        linkedChapterIds: input.linkedChapterIds,
      }
    );

    return this.repository.create(input.userId, document);
  }
}
