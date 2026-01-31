// ABOUTME: MongoDB implementation of PasswordResetTokenRepository.
// ABOUTME: Handles secure token storage with expiration and usage tracking.

import { Db, Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { PasswordResetToken, CreatePasswordResetToken } from '@/domain/entities/PasswordResetToken';
import { PasswordResetTokenRepository } from '@/domain/interfaces/PasswordResetTokenRepository';

interface PasswordResetTokenDocument {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export class MongoDBPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private collection: Collection<PasswordResetTokenDocument>;

  constructor(db: Db) {
    this.collection = db.collection<PasswordResetTokenDocument>('password_reset_tokens');
  }

  async create(data: CreatePasswordResetToken): Promise<PasswordResetToken> {
    const now = new Date();
    const doc: PasswordResetTokenDocument = {
      _id: randomUUID(),
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      createdAt: now,
    };

    await this.collection.insertOne(doc);

    return {
      id: doc._id,
      userId: doc.userId,
      token: doc.token,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
    };
  }

  async findValidToken(token: string): Promise<PasswordResetToken | null> {
    const now = new Date();

    const doc = await this.collection.findOne({
      token,
      expiresAt: { $gt: now },
      usedAt: { $exists: false },
    });

    if (!doc) return null;

    return {
      id: doc._id,
      userId: doc.userId,
      token: doc.token,
      expiresAt: doc.expiresAt,
      usedAt: doc.usedAt,
      createdAt: doc.createdAt,
    };
  }

  async markAsUsed(tokenId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: tokenId },
      { $set: { usedAt: new Date() } }
    );
    return result.matchedCount > 0;
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await this.collection.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.collection.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  }
}
