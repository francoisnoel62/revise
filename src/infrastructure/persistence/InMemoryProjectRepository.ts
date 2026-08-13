// ABOUTME: In-memory implementation of ProjectRepository for testing.
// ABOUTME: Stores projects in a Map keyed by projectId.

import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { deserializeProject, serializeProject } from './serialization/project-serializer';

function copyProject(project: Project): Project {
  return deserializeProject(serializeProject(project));
}

/**
 * In-memory ProjectRepository for testing.
 * Simulates multi-tenant behavior with ownership filtering.
 */
export class InMemoryProjectRepository implements ProjectRepository {
  private projects: Map<string, Project> = new Map();

  async createProject(userId: string, project: Project): Promise<Project> {
    if (project.getOwnerId() !== userId) {
      throw new Error('Project ownerId does not match userId');
    }
    if (this.projects.has(project.getId())) {
      throw new Error(`Project with id ${project.getId()} already exists`);
    }
    this.projects.set(project.getId(), copyProject(project));
    return project;
  }

  async loadProject(userId: string, projectId: string): Promise<Project | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;
    if (project.getOwnerId() !== userId) return null; // Security: don't reveal existence
    return copyProject(project);
  }

  async listProjects(userId: string): Promise<Project[]> {
    const userProjects: Project[] = [];
    for (const project of this.projects.values()) {
      if (project.getOwnerId() === userId) {
        userProjects.push(copyProject(project));
      }
    }
    // Sort by updatedAt descending
    return userProjects.sort(
      (a, b) => b.getUpdatedAt().getTime() - a.getUpdatedAt().getTime()
    );
  }

  async updateProject(userId: string, project: Project): Promise<Project> {
    const existing = this.projects.get(project.getId());
    if (!existing) {
      throw new Error(`Project with id ${project.getId()} not found`);
    }
    if (existing.getOwnerId() !== userId) {
      throw new Error('Not authorized to update this project');
    }
    this.projects.set(project.getId(), copyProject(project));
    return project;
  }

  async replaceProjectIfUnchanged(
    userId: string,
    project: Project,
    expectedUpdatedAt: Date
  ): Promise<boolean> {
    const existing = this.projects.get(project.getId());
    if (!existing) return false;
    if (existing.getOwnerId() !== userId) return false;
    if (existing.getUpdatedAt().getTime() !== expectedUpdatedAt.getTime()) return false;

    this.projects.set(project.getId(), copyProject(project));
    return true;
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const existing = this.projects.get(projectId);
    if (!existing) {
      throw new Error(`Project with id ${projectId} not found`);
    }
    if (existing.getOwnerId() !== userId) {
      throw new Error('Not authorized to delete this project');
    }
    this.projects.delete(projectId);
  }

  async updateChapter(userId: string, projectId: string, _chapter: Chapter): Promise<void> {
    const project = await this.loadProject(userId, projectId);
    if (!project) {
      throw new Error(`Project with id ${projectId} not found or not owned`);
    }
    const storedChapter = project.getChapter(_chapter.getId());
    if (!storedChapter) {
      throw new Error('Project or chapter not found, or not owned');
    }

    storedChapter.updateTitle(_chapter.getTitle());
    storedChapter.updateContent(_chapter.getContent());
    storedChapter.reorder(_chapter.getOrder());
    project.touch();
    this.projects.set(projectId, copyProject(project));
  }

  async deleteAllByOwner(userId: string): Promise<number> {
    let count = 0;
    for (const [id, project] of this.projects) {
      if (project.getOwnerId() === userId) {
        this.projects.delete(id);
        count++;
      }
    }
    return count;
  }

  async findPublishedByToken(projectId: string, shareToken: string): Promise<Project | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;
    if (!project.getIsPublished()) return null;
    if (project.getShareToken() !== shareToken) return null;
    return copyProject(project);
  }

  // Test helpers
  clear(): void {
    this.projects.clear();
  }

  getProjectCount(): number {
    return this.projects.size;
  }
}
