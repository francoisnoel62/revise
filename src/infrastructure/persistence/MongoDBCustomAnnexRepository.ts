// ABOUTME: MongoDB implementation of CustomAnnexRepository with multi-tenant isolation.
// ABOUTME: All queries filter by ownerId; annexes are listed sorted by placement then order.

import { Db, Collection } from 'mongodb';
import { CustomAnnex, type AnnexPlacement } from '@/domain/entities/CustomAnnex';
import { CustomAnnexRepository } from '@/domain/interfaces/CustomAnnexRepository';
import {
  CustomAnnexDocument,
  serializeCustomAnnex,
  deserializeCustomAnnex,
} from './serialization/custom-annex-serializer';

export class MongoDBCustomAnnexRepository implements CustomAnnexRepository {
  private collection: Collection<CustomAnnexDocument>;

  constructor(db: Db) {
    this.collection = db.collection<CustomAnnexDocument>('custom_annexes');
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { projectId: 1, ownerId: 1 },
      { name: 'projectId_ownerId' },
    );
    await this.collection.createIndex(
      { _id: 1, ownerId: 1 },
      { name: 'id_ownerId' },
    );
  }

  async findByProjectId(ownerId: string, projectId: string): Promise<CustomAnnex[]> {
    const docs = await this.collection
      .find({ projectId, ownerId })
      .sort({ placement: 1, order: 1 })
      .toArray();
    return docs.map(deserializeCustomAnnex);
  }

  async findById(ownerId: string, id: string): Promise<CustomAnnex | null> {
    const doc = await this.collection.findOne({ _id: id, ownerId });
    return doc ? deserializeCustomAnnex(doc) : null;
  }

  async countByProjectAndPlacement(
    ownerId: string,
    projectId: string,
    placement: AnnexPlacement,
  ): Promise<number> {
    return this.collection.countDocuments({ projectId, ownerId, placement });
  }

  async create(ownerId: string, annex: CustomAnnex): Promise<CustomAnnex> {
    const doc = serializeCustomAnnex(annex, ownerId);
    await this.collection.insertOne(doc);
    return annex;
  }

  async update(ownerId: string, annex: CustomAnnex): Promise<CustomAnnex> {
    const doc = serializeCustomAnnex(annex, ownerId);
    await this.collection.replaceOne({ _id: annex.getId(), ownerId }, doc);
    return annex;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id, ownerId });
  }

  async deleteByProjectId(ownerId: string, projectId: string): Promise<void> {
    await this.collection.deleteMany({ projectId, ownerId });
  }

  async deleteAllByOwner(ownerId: string): Promise<number> {
    const result = await this.collection.deleteMany({ ownerId });
    return result.deletedCount ?? 0;
  }
}
