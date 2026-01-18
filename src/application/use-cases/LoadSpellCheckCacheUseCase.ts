// ABOUTME: Use case for loading spell check cache for a chapter
// ABOUTME: Returns cached corrections if content hash matches, null otherwise

import { SpellCheckCacheRepository } from '@/domain/interfaces/SpellCheckCacheRepository';
import { SpellCheckCache } from '@/domain/entities/SpellCheckCache';

export interface LoadSpellCheckCacheInput {
  ownerId: string;
  chapterId: string;
  contentHash: string;
}

export interface LoadSpellCheckCacheResult {
  cache: SpellCheckCache | null;
  isValid: boolean;
}

export class LoadSpellCheckCacheUseCase {
  constructor(
    private readonly cacheRepository: SpellCheckCacheRepository
  ) {}

  async execute(input: LoadSpellCheckCacheInput): Promise<LoadSpellCheckCacheResult> {
    // Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.contentHash || input.contentHash.trim().length === 0) {
      throw new Error('Content hash is required');
    }

    // Load cache from repository
    const cache = await this.cacheRepository.findByChapterId(
      input.ownerId,
      input.chapterId
    );

    if (!cache) {
      return { cache: null, isValid: false };
    }

    // Check if cache is valid for the current content
    const isValid = cache.isValidFor(input.contentHash);

    return { cache, isValid };
  }
}
