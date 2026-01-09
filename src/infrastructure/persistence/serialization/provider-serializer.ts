// ABOUTME: Serialization utilities for Provider entity to/from MongoDB documents.
// ABOUTME: Handles encryption/decryption at the repository boundary.

import { Provider, ProviderType } from '@/domain/entities/Provider';

/**
 * MongoDB document structure for Provider entity.
 */
export interface ProviderDocument {
  _id: string;
  ownerId: string;
  name: string;
  type: string;
  // Encrypted fields (AES-256-GCM requires 3 parts)
  encryptedApiKey: string;
  encryptionIV: string;
  authTag: string;
  // Provider config
  model: string;
  isValid: boolean;
  lastTested?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Serialize a Provider entity to MongoDB document.
 *
 * NOTE: This function does NOT encrypt the API key.
 * Encryption is handled in the repository layer.
 *
 * @param provider The provider entity to serialize
 * @param encryptedData The encrypted API key data from crypto.encryptApiKey()
 * @returns MongoDB document ready for insertion
 */
export function serializeProvider(
  provider: Provider,
  encryptedData: {
    encryptedData: string;
    iv: string;
    authTag: string;
  }
): ProviderDocument {
  return {
    _id: provider.getId(),
    ownerId: provider.getOwnerId(),
    name: provider.getName(),
    type: provider.getType(),
    encryptedApiKey: encryptedData.encryptedData,
    encryptionIV: encryptedData.iv,
    authTag: encryptedData.authTag,
    model: provider.getModel(),
    isValid: provider.isValidProvider(),
    lastTested: provider.getLastTested(),
    createdAt: provider.getCreatedAt(),
    updatedAt: provider.getUpdatedAt(),
  };
}

/**
 * Deserialize a MongoDB document to Provider entity.
 *
 * NOTE: This function does NOT decrypt the API key.
 * Decryption is handled in the repository layer.
 *
 * @param doc The MongoDB document
 * @param decryptedApiKey The decrypted API key from crypto.decryptApiKey()
 * @returns Provider entity instance
 */
export function deserializeProvider(
  doc: ProviderDocument,
  decryptedApiKey: string
): Provider {
  return new Provider(
    doc._id,
    doc.ownerId,
    doc.name,
    doc.type as ProviderType,
    decryptedApiKey,
    doc.model,
    doc.isValid,
    new Date(doc.createdAt),
    new Date(doc.updatedAt),
    doc.lastTested ? new Date(doc.lastTested) : undefined
  );
}
