// ABOUTME: Use case for creating new project settings
// ABOUTME: Idempotent - returns existing settings if already created for this project

import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import {
  ProjectSettingsRepository,
  DuplicateProjectSettingsError,
} from '@/domain/interfaces/ProjectSettingsRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateProjectSettingsInput {
  userId: string;
  projectId: string;
  title: string;
}

export class CreateProjectSettingsUseCase {
  constructor(
    private readonly repository: ProjectSettingsRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateProjectSettingsInput): Promise<ProjectSettings> {
    // Check if settings already exist for this project (idempotent operation)
    const existing = await this.repository.findByProjectId(input.userId, input.projectId);
    if (existing) {
      return existing;
    }

    const settings = ProjectSettings.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.title
    );

    try {
      return await this.repository.create(input.userId, settings);
    } catch (error) {
      // Handle race condition: if another request created settings concurrently,
      // return the existing settings instead of failing
      if (error instanceof DuplicateProjectSettingsError) {
        const created = await this.repository.findByProjectId(input.userId, input.projectId);
        if (created) {
          return created;
        }
      }
      throw error;
    }
  }
}
