// ABOUTME: MongoDB implementation of ProjectTaskRepository
// ABOUTME: Provides persistence for project tasks with multi-tenant isolation

import { Db, ObjectId, Filter, Sort } from 'mongodb';
import {
  ProjectTaskRepository,
  TaskFilters,
  TaskSortOptions,
} from '@/domain/interfaces/ProjectTaskRepository';
import { ProjectTask } from '@/domain/entities/ProjectTask';
import {
  ProjectTaskDocument,
  serializeProjectTask,
  deserializeProjectTask,
} from './project-task-serializer';

const COLLECTION_NAME = 'projectTasks';

export class MongoDBProjectTaskRepository implements ProjectTaskRepository {
  constructor(private readonly db: Db) {}

  async create(userId: string, task: ProjectTask): Promise<ProjectTask> {
    if (task.getOwnerId() !== userId) {
      throw new Error('Task owner does not match user');
    }

    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);
    const doc = serializeProjectTask(task);

    await collection.insertOne(doc);
    return task;
  }

  async findById(userId: string, taskId: string): Promise<ProjectTask | null> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(taskId);
    } catch {
      return null;
    }

    const doc = await collection.findOne({
      _id: objectId,
      ownerId: userId,
    });

    return doc ? deserializeProjectTask(doc) : null;
  }

  async findByProjectId(
    userId: string,
    projectId: string,
    options: {
      filters?: TaskFilters;
      sort?: TaskSortOptions;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ProjectTask[]> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);

    const filter = this.buildFilter(userId, projectId, options.filters);
    const sort = this.buildSort(options.sort);

    let cursor = collection.find(filter).sort(sort);

    if (options.offset) cursor = cursor.skip(options.offset);
    if (options.limit) cursor = cursor.limit(options.limit);

    const docs = await cursor.toArray();
    return docs.map(deserializeProjectTask);
  }

  async countByProjectId(
    userId: string,
    projectId: string,
    filters?: TaskFilters
  ): Promise<number> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);
    const filter = this.buildFilter(userId, projectId, filters);
    return collection.countDocuments(filter);
  }

  async update(userId: string, task: ProjectTask): Promise<ProjectTask> {
    if (task.getOwnerId() !== userId) {
      throw new Error('Task owner does not match user');
    }

    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);
    const doc = serializeProjectTask(task);

    const result = await collection.updateOne(
      { _id: doc._id, ownerId: userId },
      { $set: doc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Task not found or access denied');
    }

    return task;
  }

  async delete(userId: string, taskId: string): Promise<void> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(taskId);
    } catch {
      throw new Error('Invalid task ID');
    }

    const result = await collection.deleteOne({
      _id: objectId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Task not found or access denied');
    }
  }

  async deleteAllByProject(userId: string, projectId: string): Promise<void> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);
    await collection.deleteMany({ projectId, ownerId: userId });
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }

  async getTagsByProject(userId: string, projectId: string): Promise<string[]> {
    const collection = this.db.collection<ProjectTaskDocument>(COLLECTION_NAME);

    const result = await collection.distinct('tags', {
      projectId,
      ownerId: userId,
    });

    return result.sort();
  }

  private buildFilter(
    userId: string,
    projectId: string,
    filters?: TaskFilters
  ): Filter<ProjectTaskDocument> {
    const filter: Filter<ProjectTaskDocument> = {
      projectId,
      ownerId: userId,
    };

    if (filters) {
      if (filters.status) {
        filter.status = Array.isArray(filters.status)
          ? { $in: filters.status }
          : filters.status;
      }

      if (filters.priority) {
        filter.priority = Array.isArray(filters.priority)
          ? { $in: filters.priority }
          : filters.priority;
      }

      if (filters.linkedChapterId !== undefined) {
        filter.linkedChapterId = filters.linkedChapterId;
      }

      if (filters.tags && filters.tags.length > 0) {
        filter.tags = { $in: filters.tags };
      }

      if (filters.isOverdue === true) {
        filter.status = { $ne: 'done' };
        filter.dueDate = { $lt: new Date(), $ne: null };
      }
    }

    return filter;
  }

  private buildSort(sortOptions?: TaskSortOptions): Sort {
    if (!sortOptions) {
      // Default: in_progress first, then by priority, then by due date
      return {
        status: 1,
        priority: 1,
        dueDate: 1,
        createdAt: -1,
      };
    }

    const direction = sortOptions.direction === 'asc' ? 1 : -1;
    return { [sortOptions.field]: direction };
  }
}
