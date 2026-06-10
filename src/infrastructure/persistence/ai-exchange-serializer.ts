// ABOUTME: Serialization for AIExchange to/from MongoDB documents with at-rest content encryption
// ABOUTME: systemPrompt/input/output are encrypted; summaries expose metadata only (never decrypt)

import { ObjectId } from 'mongodb';
import { AIExchange, AIExchangeProperties } from '@/domain/entities/AIExchange';
import { AIExchangeSummary } from '@/domain/interfaces/AIExchangeRepository';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';
import { FieldEncryption } from '@/infrastructure/security/FieldEncryption';

export interface AIExchangeDocument {
  _id: ObjectId;
  userId: string;
  projectId: string;
  usageRecordId: string | null;
  operation: AIOperationType;
  provider: string;
  model: string;
  // Encrypted content (base64(iv):base64(tag):base64(ciphertext))
  systemPrompt: string;
  input: string;
  output: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  costEur: number | null;
  durationMs: number | null;
  createdAt: Date;
  expiresAt: Date;
}

export function serializeAIExchange(
  exchange: AIExchange,
  encryption: FieldEncryption
): AIExchangeDocument {
  return {
    _id: new ObjectId(exchange.getId()),
    userId: exchange.getUserId(),
    projectId: exchange.getProjectId(),
    usageRecordId: exchange.getUsageRecordId(),
    operation: exchange.getOperation(),
    provider: exchange.getProvider(),
    model: exchange.getModel(),
    systemPrompt: encryption.encrypt(exchange.getSystemPrompt()),
    input: encryption.encrypt(exchange.getInput()),
    output: encryption.encrypt(exchange.getOutput()),
    inputTokens: exchange.getInputTokens(),
    outputTokens: exchange.getOutputTokens(),
    cachedInputTokens: exchange.getCachedInputTokens(),
    costEur: exchange.getCostEur(),
    durationMs: exchange.getDurationMs(),
    createdAt: exchange.getCreatedAt(),
    expiresAt: exchange.getExpiresAt(),
  };
}

export function deserializeAIExchange(
  doc: AIExchangeDocument,
  encryption: FieldEncryption
): AIExchange {
  const props: AIExchangeProperties = {
    id: doc._id.toHexString(),
    userId: doc.userId,
    projectId: doc.projectId,
    usageRecordId: doc.usageRecordId ?? null,
    operation: doc.operation,
    provider: doc.provider,
    model: doc.model,
    systemPrompt: encryption.decrypt(doc.systemPrompt),
    input: encryption.decrypt(doc.input),
    output: encryption.decrypt(doc.output),
    inputTokens: doc.inputTokens ?? null,
    outputTokens: doc.outputTokens ?? null,
    cachedInputTokens: doc.cachedInputTokens ?? null,
    costEur: doc.costEur ?? null,
    durationMs: doc.durationMs ?? null,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
  };

  return AIExchange.reconstruct(props);
}

/** Metadata-only projection for the table view; never touches encrypted content. */
export function toAIExchangeSummary(doc: AIExchangeDocument): AIExchangeSummary {
  return {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    operation: doc.operation,
    provider: doc.provider,
    model: doc.model,
    inputTokens: doc.inputTokens ?? null,
    outputTokens: doc.outputTokens ?? null,
    costEur: doc.costEur ?? null,
    durationMs: doc.durationMs ?? null,
    createdAt: doc.createdAt,
  };
}
