// ABOUTME: MongoDB implementation of UserRepository.
// ABOUTME: Handles user storage with password hashing.

import { Db, Collection } from 'mongodb';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { User, UserRegistration, SafeUser } from '@/domain/entities/User';
import { UserRepository } from '@/domain/interfaces/UserRepository';

const SALT_ROUNDS = 12;

interface UserDocument {
  _id: string;
  email: string;
  passwordHash: string;
  name?: string;
  isApproved: boolean;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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

    return {
      id: doc._id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      isApproved: doc.isApproved ?? false,
      approvedAt: doc.approvedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id });

    if (!doc) return null;

    return {
      id: doc._id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      isApproved: doc.isApproved ?? false,
      approvedAt: doc.approvedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
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
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc);

    return {
      id: doc._id,
      email: doc.email,
      name: doc.name,
      isApproved: doc.isApproved,
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

  /**
   * Verify password against stored hash.
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
