// ABOUTME: One-shot seed script that populates the model_pricing MongoDB collection.
// ABOUTME: Run with: npx tsx scripts/seed-pricing.ts

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME ?? 'revise';

// Baseline pricing snapshot (USD/M tokens) as of June 2026
const SEED_ENTRIES = [
  { provider: 'anthropic', prefix: 'claude-opus-4',    inputPerM: 5.00,  outputPerM: 25.00, cachedInputPerM: 0.50,  cachedInInput: false },
  { provider: 'anthropic', prefix: 'claude-sonnet-4',  inputPerM: 3.00,  outputPerM: 15.00, cachedInputPerM: 0.30,  cachedInInput: false },
  { provider: 'anthropic', prefix: 'claude-haiku-4',   inputPerM: 1.00,  outputPerM: 5.00,  cachedInputPerM: 0.10,  cachedInInput: false },
  { provider: 'openai',    prefix: 'gpt-4o-mini',      inputPerM: 0.40,  outputPerM: 1.60,  cachedInputPerM: 0.20,  cachedInInput: true  },
  { provider: 'openai',    prefix: 'gpt-4o',           inputPerM: 2.50,  outputPerM: 10.00, cachedInputPerM: 1.25,  cachedInInput: true  },
  { provider: 'openai',    prefix: 'gpt-5',            inputPerM: 1.25,  outputPerM: 5.00,  cachedInputPerM: 0.125, cachedInInput: true  },
  { provider: 'google',    prefix: 'gemini-2.5-flash', inputPerM: 0.15,  outputPerM: 0.60,  cachedInputPerM: 0.015, cachedInInput: true  },
  { provider: 'google',    prefix: 'gemini-2.5-pro',   inputPerM: 1.25,  outputPerM: 10.00, cachedInputPerM: 0.125, cachedInInput: true  },
  { provider: 'google',    prefix: 'gemini',           inputPerM: 0.10,  outputPerM: 0.40,  cachedInputPerM: 0.010, cachedInInput: true  },
];

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection('model_pricing');

  await col.createIndex({ provider: 1, prefix: 1 }, { unique: true });

  const now = new Date();
  const ops = SEED_ENTRIES.map((e) => ({
    updateOne: {
      filter: { provider: e.provider, prefix: e.prefix },
      update: { $setOnInsert: { ...e, updatedAt: now } },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops);
  console.log(`Seed done — ${result.upsertedCount} inserted, ${result.matchedCount} already existed`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
