// ABOUTME: Use case for loading project settings by project ID
// ABOUTME: Returns null if settings don't exist

import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';

export interface LoadProjectSettingsInput {
  userId: string;
  projectId: string;
}

export class LoadProjectSettingsUseCase {
  constructor(private readonly repository: ProjectSettingsRepository) {}

  async execute(input: LoadProjectSettingsInput): Promise<ProjectSettings | null> {
    return this.repository.findByProjectId(input.userId, input.projectId);
  }
}
