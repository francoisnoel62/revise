// ABOUTME: MongoDB implementation of PendingPriceChangeRepository.
// ABOUTME: Persists quarantined price variations awaiting admin review, keyed by (provider, prefix).

import { Db, ObjectId } from 'mongodb';
import {
  PendingPriceChange,
  PendingPriceChangeRepository,
} from '@/domain/interfaces/PendingPriceChangeRepository';
import { PricingProvider } from '@/domain/interfaces/ModelPricingRepository';
import { PriceSnapshot } from '@/domain/interfaces/EmailService';

const COLLECTION = 'pending_price_changes';

interface PendingPriceChangeDocument {
  _id: ObjectId;
  key: string;
  provider: PricingProvider;
  prefix: string;
  modelPricingId: string;
  previous: PriceSnapshot;
  current: PriceSnapshot;
  detectedAt: Date;
}

function deserialize(doc: PendingPriceChangeDocument): PendingPriceChange {
  return {
    id: doc._id.toString(),
    key: doc.key,
    provider: doc.provider,
    prefix: doc.prefix,
    modelPricingId: doc.modelPricingId,
    previous: doc.previous,
    current: doc.current,
    detectedAt: doc.detectedAt,
  };
}

export class MongoDBPendingPriceChangeRepository implements PendingPriceChangeRepository {
  constructor(private readonly db: Db) {}

  async findAll(): Promise<PendingPriceChange[]> {
    const collection = this.db.collection<PendingPriceChangeDocument>(COLLECTION);
    const docs = await collection.find({}).toArray();
    return docs.map(deserialize);
  }

  async upsert(change: Omit<PendingPriceChange, 'id'>): Promise<void> {
    const collection = this.db.collection<PendingPriceChangeDocument>(COLLECTION);
    await collection.updateOne({ key: change.key }, { $set: { ...change } }, { upsert: true });
  }

  async deleteByKey(key: string): Promise<void> {
    const collection = this.db.collection<PendingPriceChangeDocument>(COLLECTION);
    await collection.deleteOne({ key });
  }

  async delete(id: string): Promise<void> {
    const collection = this.db.collection<PendingPriceChangeDocument>(COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(id) });
  }

  async ensureIndexes(): Promise<void> {
    const collection = this.db.collection(COLLECTION);
    await collection.createIndex({ key: 1 }, { unique: true });
  }
}
