// ABOUTME: MongoDB ObjectId generator implementation.
// ABOUTME: Implements IdGenerator interface for MongoDB-compatible IDs.

import { ObjectId } from 'mongodb';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

/**
 * ObjectId generator using MongoDB's ObjectId.
 * Generates 24-character hex string IDs compatible with MongoDB.
 */
export class ObjectIdGenerator implements IdGenerator {
  generate(): string {
    return new ObjectId().toHexString();
  }
}

/**
 * Singleton instance for convenience.
 */
export const objectIdGenerator = new ObjectIdGenerator();
