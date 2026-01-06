// ABOUTME: In-memory mock implementation of ProjectRepository for Phase 2
// ABOUTME: No actual persistence - data lost on refresh (Phase 3 will implement real storage)

import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

export class InMemoryProjectRepository implements ProjectRepository {
  private project: Project | null = null;

  async saveProject(project: Project): Promise<Project> {
    // In Phase 2, just store in memory (lost on refresh)
    this.project = project;
    return project;
  }

  async loadProject(_projectId: string): Promise<Project | null> {
    // In Phase 2, return in-memory project (projectId unused)
    return this.project;
  }

  async saveChapter(_chapter: Chapter): Promise<void> {
    // In Phase 2, chapter already updated in Project entity
    // No additional persistence needed
  }

  async deleteProject(_projectId: string): Promise<void> {
    this.project = null;
  }
}
