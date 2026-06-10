// ABOUTME: MongoDB implementation of ModelPricingRepository.
// ABOUTME: Persists AI model pricing entries synced from OpenRouter, with upsert on (provider, prefix).

import { Db, ObjectId } from 'mongodb';
import {
  ModelPricingEntry,
  ModelPricingRepository,
  PricingProvider,
} from '@/domain/interfaces/ModelPricingRepository';

const COLLECTION = 'model_pricing';

interface ModelPricingDocument {
  _id: ObjectId;
  provider: PricingProvider;
  prefix: string;
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM: number;
  cachedInInput: boolean;
  updatedAt: Date;
}

function deserialize(doc: ModelPricingDocument): ModelPricingEntry {
  return {
    id: doc._id.toString(),
    provider: doc.provider,
    prefix: doc.prefix,
    inputPerM: doc.inputPerM,
    outputPerM: doc.outputPerM,
    cachedInputPerM: doc.cachedInputPerM,
    cachedInInput: doc.cachedInInput,
    updatedAt: doc.updatedAt,
  };
}

export class MongoDBModelPricingRepository implements ModelPricingRepository {
  constructor(private readonly db: Db) {}

  async upsertMany(entries: Omit<ModelPricingEntry, 'id'>[]): Promise<void> {
    if (entries.length === 0) return;
    const collection = this.db.collection<ModelPricingDocument>(COLLECTION);
    const ops = entries.map((e) => ({
      updateOne: {
        filter: { provider: e.provider, prefix: e.prefix },
        update: { $set: { ...e } },
        upsert: true,
      },
    }));
    await collection.bulkWrite(ops);
  }

  async findAll(): Promise<ModelPricingEntry[]> {
    const collection = this.db.collection<ModelPricingDocument>(COLLECTION);
    const docs = await collection.find({}).toArray();
    return docs.map(deserialize);
  }

  async findByProvider(provider: PricingProvider): Promise<ModelPricingEntry[]> {
    const collection = this.db.collection<ModelPricingDocument>(COLLECTION);
    const docs = await collection.find({ provider }).toArray();
    return docs.map(deserialize);
  }

  async update(
    id: string,
    data: Partial<Omit<ModelPricingEntry, 'id' | 'provider' | 'prefix'>>
  ): Promise<ModelPricingEntry | null> {
    const collection = this.db.collection<ModelPricingDocument>(COLLECTION);
    const doc = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return doc ? deserialize(doc) : null;
  }

  async delete(id: string): Promise<void> {
    const collection = this.db.collection<ModelPricingDocument>(COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(id) });
  }

  async ensureIndexes(): Promise<void> {
    const collection = this.db.collection(COLLECTION);
    await collection.createIndex({ provider: 1, prefix: 1 }, { unique: true });
  }
}
