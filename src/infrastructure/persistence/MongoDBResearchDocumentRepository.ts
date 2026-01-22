// ABOUTME: MongoDB implementation of ResearchDocumentRepository
// ABOUTME: Provides persistence for research documents with multi-tenant isolation

import { Db, ObjectId, Filter } from 'mongodb';
import {
  ResearchDocumentRepository,
  ResearchDocumentFilters,
} from '@/domain/interfaces/ResearchDocumentRepository';
import { ResearchDocument } from '@/domain/entities/ResearchDocument';
import {
  ResearchDocumentDocument,
  serializeResearchDocument,
  deserializeResearchDocument,
} from './research-document-serializer';

const COLLECTION_NAME = 'researchDocuments';

export class MongoDBResearchDocumentRepository implements ResearchDocumentRepository {
  constructor(private readonly db: Db) {}

  async ensureIndexes(): Promise<void> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);
    await collection.createIndex({ projectId: 1, ownerId: 1 });
    await collection.createIndex({ ownerId: 1 });
    await collection.createIndex({ tags: 1 });
    await collection.createIndex({ updatedAt: -1 });
  }

  async create(userId: string, document: ResearchDocument): Promise<ResearchDocument> {
    if (document.getOwnerId() !== userId) {
      throw new Error('Research document owner does not match user');
    }

    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);
    const doc = serializeResearchDocument(document);

    await collection.insertOne(doc);
    return document;
  }

  async findById(userId: string, documentId: string): Promise<ResearchDocument | null> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(documentId);
    } catch {
      return null;
    }

    const doc = await collection.findOne({
      _id: objectId,
      ownerId: userId,
    });

    return doc ? deserializeResearchDocument(doc) : null;
  }

  async findByProjectId(
    userId: string,
    projectId: string,
    filters?: ResearchDocumentFilters
  ): Promise<ResearchDocument[]> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);

    const filter = this.buildFilter(userId, projectId, filters);

    const docs = await collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    return docs.map(deserializeResearchDocument);
  }

  async countByProjectId(userId: string, projectId: string): Promise<number> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);
    return collection.countDocuments({ projectId, ownerId: userId });
  }

  async getAllTags(userId: string, projectId: string): Promise<string[]> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);

    const result = await collection.distinct('tags', {
      projectId,
      ownerId: userId,
    });

    return result.sort();
  }

  async update(userId: string, document: ResearchDocument): Promise<ResearchDocument> {
    if (document.getOwnerId() !== userId) {
      throw new Error('Research document owner does not match user');
    }

    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);
    const doc = serializeResearchDocument(document);

    const result = await collection.updateOne(
      { _id: doc._id, ownerId: userId },
      { $set: doc }
    );

    if (result.matchedCount === 0) {
      throw new Error('Research document not found or access denied');
    }

    return document;
  }

  async delete(userId: string, documentId: string): Promise<void> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(documentId);
    } catch {
      throw new Error('Invalid document ID');
    }

    const result = await collection.deleteOne({
      _id: objectId,
      ownerId: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Research document not found or access denied');
    }
  }

  async deleteAllByProject(userId: string, projectId: string): Promise<void> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);
    await collection.deleteMany({ projectId, ownerId: userId });
  }

  async deleteAllByOwner(userId: string): Promise<void> {
    const collection = this.db.collection<ResearchDocumentDocument>(COLLECTION_NAME);
    await collection.deleteMany({ ownerId: userId });
  }

  private buildFilter(
    userId: string,
    projectId: string,
    filters?: ResearchDocumentFilters
  ): Filter<ResearchDocumentDocument> {
    const filter: Filter<ResearchDocumentDocument> = {
      projectId,
      ownerId: userId,
    };

    if (filters) {
      if (filters.type) {
        filter.type = filters.type;
      }

      if (filters.tag) {
        filter.tags = filters.tag.toLowerCase();
      }

      if (filters.linkedChapterId) {
        filter.linkedChapterIds = filters.linkedChapterId;
      }
    }

    return filter;
  }
}
