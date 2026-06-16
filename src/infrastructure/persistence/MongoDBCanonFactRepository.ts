// ABOUTME: MongoDB implementation of CanonFactRepository (the canon ledger)
// ABOUTME: Temporal selection + derived/author reconciliation; multi-tenant isolation by ownerId

import { Db, ObjectId } from 'mongodb';
import { CanonFactRepository } from '@/domain/interfaces/CanonFactRepository';
import { CanonFact } from '@/domain/entities/CanonFact';
import {
  CanonFactDocument,
  serializeCanonFact,
  deserializeCanonFact,
} from './canon-fact-serializer';

const COLLECTION_NAME = 'canonFacts';

export class MongoDBCanonFactRepository implements CanonFactRepository {
  constructor(private readonly db: Db) {}

  private collection() {
    return this.db.collection<CanonFactDocument>(COLLECTION_NAME);
  }

  async ensureIndexes(): Promise<void> {
    await this.collection().createIndex({ ownerId: 1, projectId: 1, entity: 1 });
    await this.collection().createIndex({ ownerId: 1, projectId: 1, validFromChapter: 1 });
  }

  async save(fact: CanonFact): Promise<CanonFact> {
    await this.collection().insertOne(serializeCanonFact(fact));
    return fact;
  }

  async update(ownerId: string, fact: CanonFact): Promise<void> {
    const doc = serializeCanonFact(fact);
    await this.collection().updateOne(
      { _id: doc._id, ownerId },
      {
        $set: {
          entity: doc.entity,
          statement: doc.statement,
          validFromChapter: doc.validFromChapter,
          validToChapter: doc.validToChapter,
          source: doc.source,
          sourceChapterId: doc.sourceChapterId,
          contentHash: doc.contentHash,
          updatedAt: doc.updatedAt,
        },
      }
    );
  }

  async delete(ownerId: string, factId: string): Promise<void> {
    await this.collection().deleteOne({ _id: new ObjectId(factId), ownerId });
  }

  async listByProject(ownerId: string, projectId: string): Promise<CanonFact[]> {
    const docs = await this.collection()
      .find({ ownerId, projectId })
      .sort({ entity: 1, validFromChapter: 1 })
      .toArray();
    return docs.map(deserializeCanonFact);
  }

  async findForSelection(
    ownerId: string,
    projectId: string,
    entities: string[],
    chapterIndex: number
  ): Promise<CanonFact[]> {
    if (entities.length === 0) return [];
    const docs = await this.collection()
      .find({
        ownerId,
        projectId,
        entity: { $in: entities },
        validFromChapter: { $lte: chapterIndex },
        $or: [{ validToChapter: null }, { validToChapter: { $gte: chapterIndex } }],
      })
      .sort({ entity: 1, validFromChapter: 1 })
      .toArray();
    return docs.map(deserializeCanonFact);
  }

  async replaceDerived(
    ownerId: string,
    projectId: string,
    facts: CanonFact[]
  ): Promise<void> {
    await this.collection().deleteMany({ ownerId, projectId, source: 'derived' });
    if (facts.length > 0) {
      await this.collection().insertMany(facts.map(serializeCanonFact));
    }
  }

  async deleteAllByOwner(ownerId: string): Promise<void> {
    await this.collection().deleteMany({ ownerId });
  }
}
