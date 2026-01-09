// ABOUTME: Use case for listing all projects for a user.
// ABOUTME: Returns project list for dashboard display.

import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

export interface ListProjectsInput {
  ownerId: string;
}

export class ListProjectsUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<Project[]> {
    return this.projectRepository.listProjects(input.ownerId);
  }
}
