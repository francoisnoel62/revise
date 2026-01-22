// ABOUTME: MongoDB implementation of ProjectSettingsRepository
// ABOUTME: Provides persistence for project settings with multi-tenant isolation

import { Db, ObjectId } from 'mongodb';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import {
  ProjectSettingsDocument,
  serializeProjectSettings,
  deserializeProjectSettings,
} from './project-settings-serializer';

const COLLECTION_NAME = 'project_settings';

export class MongoDBProjectSettingsRepository implements ProjectSettingsRepository {
  constructor(private readonly db: Db) {}

  async ensureIndexes(): Promise<void> {
    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);
    await collection.createIndex({ ownerId: 1, projectId: 1 }, { unique: true });
  }

  async create(userId: string, settings: ProjectSettings): Promise<ProjectSettings> {
    if (settings.getOwnerId() !== userId) {
      throw new Error('Settings owner does not match user');
    }

    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);
    const doc = serializeProjectSettings(settings);

    await collection.insertOne(doc);
    return settings;
  }

  async findById(userId: string, settingsId: string): Promise<ProjectSettings | null> {
    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(settingsId);
    } catch {
      return null;
    }

    const doc = await collection.findOne({
      _id: objectId,
      ownerId: userId,
    });

    return doc ? deserializeProjectSettings(doc) : null;
  }

  async findByProjectId(userId: string, projectId: string): Promise<ProjectSettings | null> {
    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);

    const doc = await collection.findOne({
      projectId,
      ownerId: userId,
    });

    return doc ? deserializeProjectSettings(doc) : null;
  }

  async update(userId: string, settings: ProjectSettings): Promise<ProjectSettings> {
    if (settings.getOwnerId() !== userId) {
      throw new Error('Settings owner does not match user');
    }

    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);
    const doc = serializeProjectSettings(settings);

    const result = await collection.updateOne(
      { _id: doc._id, ownerId: userId },
      { $set: doc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Settings not found or access denied');
    }

    return settings;
  }

  async delete(userId: string, settingsId: string): Promise<void> {
    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(settingsId);
    } catch {
      throw new Error('Invalid settings ID');
    }

    const result = await collection.deleteOne({
      _id: objectId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Settings not found or access denied');
    }
  }

  async deleteByProjectId(userId: string, projectId: string): Promise<void> {
    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);
    await collection.deleteMany({
      projectId,
      ownerId: userId,
    });
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<ProjectSettingsDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }
}
