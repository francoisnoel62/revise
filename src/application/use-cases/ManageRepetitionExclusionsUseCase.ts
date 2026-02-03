// ABOUTME: Use case for managing user-defined repetition exclusions
// ABOUTME: CRUD operations for words to exclude from repetition detection

import { AnalysisRepository, RepetitionExclusionRecord } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';

export interface AddRepetitionExclusionInput {
  ownerId: string;
  projectId: string;
  word: string;
  reason?: string;
}

export interface RemoveRepetitionExclusionInput {
  ownerId: string;
  projectId: string;
  word: string;
}

export interface ListRepetitionExclusionsInput {
  ownerId: string;
  projectId: string;
}

export interface ListRepetitionExclusionsResult {
  exclusions: RepetitionExclusionRecord[];
}

/**
 * Use case for managing repetition exclusions.
 *
 * Allows users to:
 * - Add words to exclude from repetition detection
 * - Remove exclusions
 * - List all exclusions for a project
 */
export class ManageRepetitionExclusionsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository
  ) {}

  async addExclusion(input: AddRepetitionExclusionInput): Promise<void> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.word || input.word.trim().length === 0) {
      throw new Error('Word is required');
    }

    // 2. Verify project ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Save exclusion
    await this.analysisRepository.saveRepetitionExclusion(
      input.ownerId,
      input.projectId,
      input.word.trim().toLowerCase(),
      input.reason
    );
  }

  async removeExclusion(input: RemoveRepetitionExclusionInput): Promise<void> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.word || input.word.trim().length === 0) {
      throw new Error('Word is required');
    }

    // 2. Verify project ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Remove exclusion
    await this.analysisRepository.removeRepetitionExclusion(
      input.ownerId,
      input.projectId,
      input.word.trim().toLowerCase()
    );
  }

  async listExclusions(input: ListRepetitionExclusionsInput): Promise<ListRepetitionExclusionsResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    // 2. Verify project ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Load exclusions
    const exclusions = await this.analysisRepository.findRepetitionExclusions(
      input.ownerId,
      input.projectId
    );

    return { exclusions };
  }
}
