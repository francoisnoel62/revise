// ABOUTME: Use case for saving spell check results to cache
// ABOUTME: Creates or updates cache entry for a chapter with correction results

import { SpellCheckCacheRepository } from '@/domain/interfaces/SpellCheckCacheRepository';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { SpellCheckCache } from '@/domain/entities/SpellCheckCache';
import { SpellCheckCorrection } from '@/domain/value-objects/SpellCheckCorrection';

export interface SaveSpellCheckCacheInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  contentHash: string;
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'grammar' | 'style' | 'punctuation';
    explanation: string;
  }>;
}

export interface SaveSpellCheckCacheResult {
  cache: SpellCheckCache;
}

export class SaveSpellCheckCacheUseCase {
  constructor(
    private readonly cacheRepository: SpellCheckCacheRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: SaveSpellCheckCacheInput): Promise<SaveSpellCheckCacheResult> {
    // Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.contentHash || input.contentHash.trim().length === 0) {
      throw new Error('Content hash is required');
    }

    // Verify project exists and is owned by user
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify chapter exists in project
    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found in project');
    }

    // Convert correction data to SpellCheckCorrection instances
    const corrections = input.corrections.map(
      (c) =>
        new SpellCheckCorrection({
          original: c.original,
          corrected: c.corrected,
          type: c.type,
          explanation: c.explanation,
        })
    );

    // Check if cache already exists for this chapter
    const existingCache = await this.cacheRepository.findByChapterId(
      input.ownerId,
      input.chapterId
    );

    let cache: SpellCheckCache;

    if (existingCache) {
      // Update existing cache
      cache = existingCache.update(input.contentHash, corrections);
    } else {
      // Create new cache
      const cacheId = this.idGenerator.generate();
      cache = new SpellCheckCache(
        cacheId,
        input.chapterId,
        input.projectId,
        input.contentHash,
        corrections
      );
    }

    // Save to repository
    await this.cacheRepository.save(input.ownerId, cache);

    return { cache };
  }
}
