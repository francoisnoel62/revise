// ABOUTME: MongoDB implementation of ProjectRepository with multi-tenant support.
// ABOUTME: All queries filter by ownerId to ensure data isolation.

import { Db, Collection } from 'mongodb';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import {
  ProjectDocument,
  serializeProject,
  serializeChapter,
  deserializeProject,
} from './serialization/project-serializer';

/**
 * MongoDB implementation of ProjectRepository.
 * Enforces multi-tenant isolation via ownerId filtering on all queries.
 */
export class MongoDBProjectRepository implements ProjectRepository {
  private collection: Collection<ProjectDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ProjectDocument>('projects');
  }

  async createProject(userId: string, project: Project): Promise<Project> {
    // Verify ownership matches
    if (project.getOwnerId() !== userId) {
      throw new Error('Project ownerId does not match userId');
    }

    const doc = serializeProject(project);

    try {
      await this.collection.insertOne(doc);
      return project;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error(`Project with id ${project.getId()} already exists`);
      }
      throw error;
    }
  }

  async loadProject(userId: string, projectId: string): Promise<Project | null> {
    // Always filter by both _id AND ownerId for security
    const doc = await this.collection.findOne({
      _id: projectId,
      ownerId: userId,
    });

    if (!doc) return null;
    return deserializeProject(doc);
  }

  async listProjects(userId: string): Promise<Project[]> {
    const docs = await this.collection
      .find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .toArray();

    return docs.map(deserializeProject);
  }

  async updateProject(userId: string, project: Project): Promise<Project> {
    const doc = serializeProject(project);

    console.log('[MongoDBProjectRepository.updateProject] Saving:', {
      projectId: project.getId(),
      isPublished: doc.isPublished,
      publishedChapterIds: doc.publishedChapterIds,
      totalChapters: doc.chapters.length,
    });

    // Update only if owned by user
    const result = await this.collection.replaceOne(
      { _id: project.getId(), ownerId: userId },
      doc
    );

    if (result.matchedCount === 0) {
      throw new Error(`Project with id ${project.getId()} not found or not owned`);
    }

    return project;
  }

  async replaceProjectIfUnchanged(
    userId: string,
    project: Project,
    expectedUpdatedAt: Date
  ): Promise<boolean> {
    const doc = serializeProject(project);

    const result = await this.collection.replaceOne(
      { _id: project.getId(), ownerId: userId, updatedAt: expectedUpdatedAt },
      doc
    );

    return result.matchedCount > 0;
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: projectId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error(`Project with id ${projectId} not found or not owned`);
    }
  }

  async updateChapter(userId: string, projectId: string, chapter: Chapter): Promise<void> {
    const chapterDoc = serializeChapter(chapter);

    // Update specific chapter within the project
    // Uses positional operator $ to update matched array element
    const result = await this.collection.updateOne(
      {
        _id: projectId,
        ownerId: userId,
        'chapters.id': chapter.getId(),
      },
      {
        $set: {
          'chapters.$': chapterDoc,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Project or chapter not found, or not owned`);
    }
  }

  async deleteAllByOwner(userId: string): Promise<number> {
    const result = await this.collection.deleteMany({
      ownerId: userId,
    });
    return result.deletedCount;
  }

  async findPublishedByToken(projectId: string, shareToken: string): Promise<Project | null> {
    console.log('[MongoDBProjectRepository.findPublishedByToken] Query:', {
      projectId,
      shareToken: shareToken?.substring(0, 8) + '...',
    });

    const doc = await this.collection.findOne({
      _id: projectId,
      shareToken: shareToken,
      isPublished: true,
    });

    console.log('[MongoDBProjectRepository.findPublishedByToken] Result:', {
      found: !!doc,
      docId: doc?._id,
      isPublished: doc?.isPublished,
      hasShareToken: !!doc?.shareToken,
      publishedChapterIds: doc?.publishedChapterIds,
      totalChapters: doc?.chapters?.length,
    });

    if (!doc) return null;
    return deserializeProject(doc);
  }
}
