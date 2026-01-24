// ABOUTME: Use case for publishing a project with a shareable link.
// ABOUTME: Generates a share token and marks the project as published, with optional chapter selection.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProjectNotFoundError } from './LoadProjectUseCase';

export interface PublishProjectInput {
  ownerId: string;
  projectId: string;
  chapterIds?: string[];
}

export interface PublishProjectOutput {
  project: Project;
  shareUrl: string;
}

export class PublishProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private baseUrl: string
  ) {}

  async execute(input: PublishProjectInput): Promise<PublishProjectOutput> {
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    // Validate chapter IDs if provided
    if (input.chapterIds && input.chapterIds.length > 0) {
      const allChapterIds = project.getChapters().map((ch) => ch.getId());
      const invalidIds = input.chapterIds.filter((id) => !allChapterIds.includes(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid chapter IDs: ${invalidIds.join(', ')}`);
      }
    }

    project.publish(input.chapterIds);

    await this.projectRepository.updateProject(input.ownerId, project);

    const shareUrl = `${this.baseUrl}/read/${project.getId()}/${project.getShareToken()}`;

    return {
      project,
      shareUrl,
    };
  }
}
