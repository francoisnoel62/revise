// ABOUTME: Use case for updating spell check cache when a correction is applied
// ABOUTME: Removes the applied correction from cache and updates content hash

import { SpellCheckCacheRepository } from '@/domain/interfaces/SpellCheckCacheRepository';
import { SpellCheckCache } from '@/domain/entities/SpellCheckCache';

export interface UpdateSpellCheckCacheInput {
  ownerId: string;
  chapterId: string;
  appliedOriginal: string;
  newContentHash: string;
}

export interface UpdateSpellCheckCacheResult {
  cache: SpellCheckCache | null;
  remainingCorrections: number;
}

export class UpdateSpellCheckCacheUseCase {
  constructor(
    private readonly cacheRepository: SpellCheckCacheRepository
  ) {}

  async execute(input: UpdateSpellCheckCacheInput): Promise<UpdateSpellCheckCacheResult> {
    // Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.appliedOriginal || input.appliedOriginal.trim().length === 0) {
      throw new Error('Applied original text is required');
    }

    if (!input.newContentHash || input.newContentHash.trim().length === 0) {
      throw new Error('New content hash is required');
    }

    // Load existing cache
    const existingCache = await this.cacheRepository.findByChapterId(
      input.ownerId,
      input.chapterId
    );

    if (!existingCache) {
      // No cache exists, nothing to update
      return { cache: null, remainingCorrections: 0 };
    }

    // Remove the applied correction and update hash
    const updatedCache = existingCache.removeCorrection(
      input.appliedOriginal,
      input.newContentHash
    );

    // Save updated cache
    await this.cacheRepository.save(input.ownerId, updatedCache);

    return {
      cache: updatedCache,
      remainingCorrections: updatedCache.getCorrectionCount(),
    };
  }
}
