// ABOUTME: Use case for creating a manual snapshot of a project
// ABOUTME: Captures the current manuscript and editorial metadata under a new sequential number

import { Snapshot } from '../../domain/entities/Snapshot';
import { SnapshotRepository } from '../../domain/interfaces/SnapshotRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { ProjectSettingsRepository } from '../../domain/interfaces/ProjectSettingsRepository';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';
import { snapshotEditorialMetadataFrom } from '../services/snapshot-editorial-metadata';

export interface CreateSnapshotInput {
  ownerId: string;
  projectId: string;
  title: string;
  comment?: string | null;
}

export interface CreateSnapshotResult {
  snapshot: Snapshot;
}

export class CreateSnapshotUseCase {
  constructor(
    private readonly snapshotRepository: SnapshotRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateSnapshotInput): Promise<CreateSnapshotResult> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Snapshot title is required');
    }

    const project = await this.projectRepository.loadProject(input.ownerId, input.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const settings = await this.projectSettingsRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );

    const number = await this.snapshotRepository.getNextSequenceNumber(
      input.ownerId,
      input.projectId
    );

    const snapshot = new Snapshot({
      id: this.idGenerator.generate(),
      projectId: input.projectId,
      ownerId: input.ownerId,
      authorId: input.ownerId,
      number,
      type: 'manual',
      title: input.title,
      comment: input.comment ?? null,
      projectTitle: project.getTitle(),
      chapters: project.getChapters().map((chapter) => ({
        id: chapter.getId(),
        title: chapter.getTitle(),
        content: chapter.getContent(),
        order: chapter.getOrder(),
      })),
      editorialMetadata: settings ? snapshotEditorialMetadataFrom(settings) : null,
    });

    await this.snapshotRepository.save(input.ownerId, snapshot);

    return { snapshot };
  }
}
