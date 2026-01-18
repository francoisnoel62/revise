// ABOUTME: Use case for deleting spell check cache for a chapter
// ABOUTME: Used when content changes significantly or user requests a fresh check

import { SpellCheckCacheRepository } from '@/domain/interfaces/SpellCheckCacheRepository';

export interface DeleteSpellCheckCacheInput {
  ownerId: string;
  chapterId: string;
}

export class DeleteSpellCheckCacheUseCase {
  constructor(
    private readonly cacheRepository: SpellCheckCacheRepository
  ) {}

  async execute(input: DeleteSpellCheckCacheInput): Promise<void> {
    // Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    // Delete cache from repository
    await this.cacheRepository.deleteByChapterId(
      input.ownerId,
      input.chapterId
    );
  }
}
