// ABOUTME: Use case for listing research documents in a project
// ABOUTME: Supports filtering by type and tag

import { ResearchDocument, ResearchDocumentType } from '@/domain/entities/ResearchDocument';
import { ResearchDocumentRepository } from '@/domain/interfaces/ResearchDocumentRepository';

export interface ListResearchDocumentsInput {
  userId: string;
  projectId: string;
  type?: ResearchDocumentType;
  tag?: string;
  linkedChapterId?: string;
}

export class ListResearchDocumentsUseCase {
  constructor(private readonly repository: ResearchDocumentRepository) {}

  async execute(input: ListResearchDocumentsInput): Promise<ResearchDocument[]> {
    return this.repository.findByProjectId(input.userId, input.projectId, {
      type: input.type,
      tag: input.tag,
      linkedChapterId: input.linkedChapterId,
    });
  }
}
