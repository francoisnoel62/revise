// ABOUTME: Use case for updating a research document
// ABOUTME: Supports partial updates

import { ResearchDocument } from '@/domain/entities/ResearchDocument';
import { ResearchDocumentRepository } from '@/domain/interfaces/ResearchDocumentRepository';

export interface UpdateResearchDocumentInput {
  userId: string;
  documentId: string;
  title?: string;
  content?: Record<string, unknown> | null;
  url?: string | null;
  sourceTitle?: string | null;
  sourceAuthor?: string | null;
  tags?: string[];
  linkedChapterIds?: string[];
}

export class UpdateResearchDocumentUseCase {
  constructor(private readonly repository: ResearchDocumentRepository) {}

  async execute(input: UpdateResearchDocumentInput): Promise<ResearchDocument> {
    const existing = await this.repository.findById(input.userId, input.documentId);

    if (!existing) {
      throw new Error('Research document not found');
    }

    let updated = existing;

    if (input.title !== undefined) {
      updated = updated.updateTitle(input.title);
    }

    if (input.content !== undefined) {
      updated = updated.updateContent(input.content);
    }

    if (input.url !== undefined) {
      updated = updated.updateUrl(input.url);
    }

    if (input.sourceTitle !== undefined || input.sourceAuthor !== undefined) {
      updated = updated.updateSource(
        input.sourceTitle ?? updated.getSourceTitle(),
        input.sourceAuthor ?? updated.getSourceAuthor()
      );
    }

    if (input.tags !== undefined) {
      updated = updated.updateTags(input.tags);
    }

    return this.repository.update(input.userId, updated);
  }
}
