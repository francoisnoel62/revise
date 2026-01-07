// ABOUTME: MongoDB connection singleton optimized for serverless (Vercel).
// ABOUTME: Reuses connections across warm starts to avoid connection pool exhaustion.

import { MongoClient, Db } from 'mongodb';
import { config } from './env';

// Global cache for connection reuse in serverless environment
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Get MongoDB database connection.
 * Reuses existing connection if available (serverless optimization).
 * Creates indexes on first connection.
 */
export async function getDatabase(): Promise<Db> {
  // Return cached connection if available
  if (cachedDb) {
    return cachedDb;
  }

  // Validate configuration
  if (!config.database.uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Create new connection
  cachedClient = new MongoClient(config.database.uri, {
    maxPoolSize: 10, // Limit connections for serverless
  });

  await cachedClient.connect();
  cachedDb = cachedClient.db(config.database.dbName);

  // Create indexes (idempotent - safe to call multiple times)
  await createIndexes(cachedDb);

  return cachedDb;
}

/**
 * Create database indexes for optimal query performance.
 */
async function createIndexes(db: Db): Promise<void> {
  const projects = db.collection('projects');

  // Index for listing user's projects
  await projects.createIndex({ ownerId: 1 });

  // Compound index for sorted project lists
  await projects.createIndex({ ownerId: 1, updatedAt: -1 });

  // Compound index for ownership verification
  await projects.createIndex({ _id: 1, ownerId: 1 });

  // Users collection indexes
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
}

/**
 * Close database connection.
 * Useful for tests and graceful shutdown.
 */
export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

/**
 * Get raw MongoDB client for advanced operations.
 * Prefer getDatabase() for normal use.
 */
export function getClient(): MongoClient | null {
  return cachedClient;
}
