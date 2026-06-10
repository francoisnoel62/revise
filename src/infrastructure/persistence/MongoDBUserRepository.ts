// ABOUTME: MongoDB implementation of UserRepository.
// ABOUTME: Handles user storage with password hashing.

import { Db, Collection } from 'mongodb';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import {
  User,
  UserRegistration,
  SafeUser,
  DEFAULT_AI_EXCHANGE_RETENTION_DAYS,
} from '@/domain/entities/User';
import { UserRepository } from '@/domain/interfaces/UserRepository';

const SALT_ROUNDS = 12;

interface UserDocument {
  _id: string;
  email: string;
  passwordHash: string;
  name?: string;
  isApproved: boolean;
  isAdmin: boolean;
  approvedAt?: Date;
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  aiExchangeLoggingEnabled?: boolean;
  aiExchangeRetentionDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

function toUser(doc: UserDocument): User {
  return {
    id: doc._id,
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    isApproved: doc.isApproved ?? false,
    isAdmin: doc.isAdmin ?? false,
    approvedAt: doc.approvedAt,
    termsAcceptedAt: doc.termsAcceptedAt,
    privacyAcceptedAt: doc.privacyAcceptedAt,
    aiExchangeLoggingEnabled: doc.aiExchangeLoggingEnabled ?? false,
    aiExchangeRetentionDays:
      doc.aiExchangeRetentionDays ?? DEFAULT_AI_EXCHANGE_RETENTION_DAYS,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoDBUserRepository implements UserRepository {
  private collection: Collection<UserDocument>;

  constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({
      email: email.toLowerCase(),
    });

    if (!doc) return null;

    return toUser(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id });

    if (!doc) return null;

    return toUser(doc);
  }

  async create(registration: UserRegistration): Promise<SafeUser> {
    const email = registration.email.toLowerCase();

    // Check if email exists
    const existing = await this.collection.findOne({ email });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registration.password, SALT_ROUNDS);

    const now = new Date();
    const doc: UserDocument = {
      _id: randomUUID(), // Use Node.js crypto API
      email,
      passwordHash,
      name: registration.name,
      isApproved: false, // New users require approval
      isAdmin: false, // Admin status must be granted manually
      termsAcceptedAt: registration.acceptedTerms ? now : undefined,
      privacyAcceptedAt: registration.acceptedPrivacy ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc);

    return {
      id: doc._id,
      email: doc.email,
      name: doc.name,
      isApproved: doc.isApproved,
      isAdmin: doc.isAdmin,
    };
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      email: email.toLowerCase(),
    });
    return count > 0;
  }

  async approveUser(userId: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: userId },
      {
        $set: {
          isApproved: true,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    return result.matchedCount > 0;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: userId });
    return result.deletedCount > 0;
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      }
    );
    return result.matchedCount > 0;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async updateAIExchangeLogging(
    userId: string,
    enabled: boolean,
    retentionDays: number
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: userId },
      {
        $set: {
          aiExchangeLoggingEnabled: enabled,
          aiExchangeRetentionDays: retentionDays,
          updatedAt: new Date(),
        },
      }
    );
    return result.matchedCount > 0;
  }

  /**
   * Verify password against stored hash.
   * @deprecated Use instance method verifyPassword instead
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
