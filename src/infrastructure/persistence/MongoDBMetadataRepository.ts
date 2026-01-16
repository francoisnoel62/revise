// ABOUTME: MongoDB implementation of MetadataRepository with multi-tenant support.
// ABOUTME: All queries filter by ownerId to ensure data isolation.

import { Db, Collection } from 'mongodb';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import {
  MetadataDocument,
  serializeMetadata,
  deserializeMetadata,
} from './serialization/metadata-serializer';

/**
 * MongoDB implementation of MetadataRepository.
 * Enforces multi-tenant isolation via ownerId filtering on all queries.
 */
export class MongoDBMetadataRepository implements MetadataRepository {
  private collection: Collection<MetadataDocument>;

  constructor(db: Db) {
    this.collection = db.collection<MetadataDocument>('project_metadata');
  }

  /**
   * Ensure indexes exist for efficient queries.
   * Call this during application startup.
   */
  async ensureIndexes(): Promise<void> {
    // Compound index for listing metadata by project
    await this.collection.createIndex(
      { projectId: 1, ownerId: 1 },
      { name: 'projectId_ownerId' }
    );

    // Compound index for finding by project and type (unique)
    await this.collection.createIndex(
      { projectId: 1, typeKey: 1, ownerId: 1 },
      { name: 'projectId_typeKey_ownerId', unique: true }
    );

    // Index for ownership verification on single lookups
    await this.collection.createIndex(
      { _id: 1, ownerId: 1 },
      { name: 'id_ownerId' }
    );
  }

  async create(ownerId: string, metadata: ProjectMetadata): Promise<ProjectMetadata> {
    const doc = serializeMetadata(metadata, ownerId);

    try {
      await this.collection.insertOne(doc);
      return metadata;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error(
          `Metadata of type "${metadata.getTypeKey()}" already exists for this project`
        );
      }
      throw error;
    }
  }

  async findById(ownerId: string, metadataId: string): Promise<ProjectMetadata | null> {
    // Always filter by both _id AND ownerId for security
    const doc = await this.collection.findOne({
      _id: metadataId,
      ownerId,
    });

    if (!doc) return null;
    return deserializeMetadata(doc);
  }

  async findByProjectId(ownerId: string, projectId: string): Promise<ProjectMetadata[]> {
    const docs = await this.collection
      .find({ projectId, ownerId })
      .sort({ createdAt: 1 })
      .toArray();

    return docs.map(deserializeMetadata);
  }

  async findByProjectAndType(
    ownerId: string,
    projectId: string,
    typeKey: string
  ): Promise<ProjectMetadata | null> {
    const doc = await this.collection.findOne({
      projectId,
      typeKey,
      ownerId,
    });

    if (!doc) return null;
    return deserializeMetadata(doc);
  }

  async update(ownerId: string, metadata: ProjectMetadata): Promise<ProjectMetadata> {
    const doc = serializeMetadata(metadata, ownerId);
    doc.updatedAt = new Date();

    // Update only if owned by user
    const result = await this.collection.replaceOne(
      { _id: metadata.getId(), ownerId },
      doc
    );

    if (result.matchedCount === 0) {
      throw new Error(`Metadata with id ${metadata.getId()} not found or not owned`);
    }

    return metadata;
  }

  async delete(ownerId: string, metadataId: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: metadataId,
      ownerId,
    });

    if (result.deletedCount === 0) {
      throw new Error(`Metadata with id ${metadataId} not found or not owned`);
    }
  }

  async deleteByProjectId(ownerId: string, projectId: string): Promise<void> {
    // Delete all metadata for a project (used when deleting project)
    await this.collection.deleteMany({
      projectId,
      ownerId,
    });
  }

  async deleteAllByOwner(ownerId: string): Promise<number> {
    const result = await this.collection.deleteMany({
      ownerId,
    });
    return result.deletedCount;
  }
}
