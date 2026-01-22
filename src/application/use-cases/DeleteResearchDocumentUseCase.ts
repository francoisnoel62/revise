// ABOUTME: Use case for deleting a research document
// ABOUTME: Validates ownership before deletion

import { ResearchDocumentRepository } from '@/domain/interfaces/ResearchDocumentRepository';

export interface DeleteResearchDocumentInput {
  userId: string;
  documentId: string;
}

export class DeleteResearchDocumentUseCase {
  constructor(private readonly repository: ResearchDocumentRepository) {}

  async execute(input: DeleteResearchDocumentInput): Promise<void> {
    await this.repository.delete(input.userId, input.documentId);
  }
}
