// ABOUTME: Use case for updating project auto spell check preference
// ABOUTME: Enables or disables automatic spell checking on chapter load

import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

export interface UpdateProjectAutoSpellCheckInput {
  ownerId: string;
  projectId: string;
  enabled: boolean;
}

export class UpdateProjectAutoSpellCheckUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectAutoSpellCheckInput): Promise<void> {
    // Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    // Load project
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // Update auto spell check setting
    project.setAutoSpellCheck(input.enabled);

    // Save project
    await this.projectRepository.updateProject(input.ownerId, project);
  }
}
