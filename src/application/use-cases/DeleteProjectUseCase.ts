// ABOUTME: Use case for deleting a project.
// ABOUTME: Handles project deletion with proper authorization.

import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

export interface DeleteProjectInput {
  ownerId: string;
  projectId: string;
}

export class DeleteProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    await this.projectRepository.deleteProject(input.ownerId, input.projectId);
  }
}
