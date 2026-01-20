// ABOUTME: Use case for publishing a project with a shareable link.
// ABOUTME: Generates a share token and marks the project as published.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProjectNotFoundError } from './LoadProjectUseCase';

export interface PublishProjectInput {
  ownerId: string;
  projectId: string;
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

    project.publish();

    await this.projectRepository.updateProject(input.ownerId, project);

    const shareUrl = `${this.baseUrl}/read/${project.getId()}/${project.getShareToken()}`;

    return {
      project,
      shareUrl,
    };
  }
}
