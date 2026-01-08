// ABOUTME: MongoDB implementation of ProviderRepository.
// ABOUTME: Encrypts API keys using AES-256-GCM before storage, decrypts after retrieval.

import { Collection, Db } from 'mongodb';
import { Provider } from '@/domain/entities/Provider';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import {
  serializeProvider,
  deserializeProvider,
  ProviderDocument,
} from './serialization/provider-serializer';
import { encryptApiKey, decryptApiKey } from '../encryption/crypto';

/**
 * MongoDB implementation of ProviderRepository.
 *
 * SECURITY:
 * - Encrypts API keys using AES-256-GCM before storage
 * - Decrypts API keys after retrieval
 * - Enforces multi-tenant isolation on ALL queries
 */
export class MongoDBProviderRepository implements ProviderRepository {
  private collection: Collection<ProviderDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ProviderDocument>('providers');
  }

  async create(userId: string, provider: Provider): Promise<Provider> {
    // Security: Verify ownership
    if (provider.getOwnerId() !== userId) {
      throw new Error('Provider ownerId does not match userId');
    }

    try {
      // Encrypt API key
      const encrypted = encryptApiKey(provider.getApiKey());

      // Serialize with encrypted data
      const doc = serializeProvider(provider, encrypted);

      // Insert into MongoDB
      await this.collection.insertOne(doc);

      return provider;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create provider: ${error.message}`);
      }
      throw new Error('Failed to create provider');
    }
  }

  async findById(userId: string, providerId: string): Promise<Provider | null> {
    try {
      // Multi-tenant query: MUST filter by both _id AND ownerId
      const doc = await this.collection.findOne({
        _id: providerId,
        ownerId: userId,
      });

      if (!doc) {
        return null;
      }

      // Decrypt API key
      const apiKey = decryptApiKey(
        doc.encryptedApiKey,
        doc.encryptionIV,
        doc.authTag
      );

      // Deserialize with decrypted key
      return deserializeProvider(doc, apiKey);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find provider: ${error.message}`);
      }
      throw new Error('Failed to find provider');
    }
  }

  async listProviders(userId: string): Promise<Provider[]> {
    try {
      // Multi-tenant query: MUST filter by ownerId
      const docs = await this.collection
        .find({ ownerId: userId })
        .sort({ createdAt: -1 }) // Most recent first
        .toArray();

      // Decrypt all API keys and deserialize
      return docs.map((doc) => {
        const apiKey = decryptApiKey(
          doc.encryptedApiKey,
          doc.encryptionIV,
          doc.authTag
        );
        return deserializeProvider(doc, apiKey);
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list providers: ${error.message}`);
      }
      throw new Error('Failed to list providers');
    }
  }

  async update(userId: string, provider: Provider): Promise<Provider> {
    try {
      // Encrypt API key (may have changed)
      const encrypted = encryptApiKey(provider.getApiKey());

      // Serialize with encrypted data
      const doc = serializeProvider(provider, encrypted);

      // Update with multi-tenant filter
      const result = await this.collection.updateOne(
        { _id: provider.getId(), ownerId: userId },
        {
          $set: {
            name: doc.name,
            encryptedApiKey: doc.encryptedApiKey,
            encryptionIV: doc.encryptionIV,
            authTag: doc.authTag,
            model: doc.model,
            isValid: doc.isValid,
            lastTested: doc.lastTested,
            updatedAt: doc.updatedAt,
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Provider not found or not owned by user');
      }

      return provider;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update provider: ${error.message}`);
      }
      throw new Error('Failed to update provider');
    }
  }

  async delete(userId: string, providerId: string): Promise<void> {
    try {
      // Multi-tenant delete
      const result = await this.collection.deleteOne({
        _id: providerId,
        ownerId: userId,
      });

      if (result.deletedCount === 0) {
        throw new Error('Provider not found or not owned by user');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete provider: ${error.message}`);
      }
      throw new Error('Failed to delete provider');
    }
  }

  async isUsedByProjects(userId: string, providerId: string): Promise<boolean> {
    try {
      // Check if provider exists and is owned by user
      const provider = await this.findById(userId, providerId);
      if (!provider) {
        return false;
      }

      // Query projects collection
      const db = this.collection.db;
      const projectsCollection = db.collection('projects');

      const count = await projectsCollection.countDocuments({
        ownerId: userId,
        providerId: providerId,
      });

      return count > 0;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to check provider usage: ${error.message}`);
      }
      throw new Error('Failed to check provider usage');
    }
  }
}
