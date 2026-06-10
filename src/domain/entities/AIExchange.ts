// ABOUTME: AIExchange entity capturing the real content of one AI exchange (input, system prompt, output)
// ABOUTME: Stored separately from AIUsageRecord to isolate bulky content and drive independent retention/purge

import { AIOperationType } from '../value-objects/AIOperationType';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AIExchangeProperties {
  id: string;
  userId: string;
  projectId: string;
  usageRecordId: string | null;
  operation: AIOperationType;
  provider: string;
  model: string;
  systemPrompt: string;
  input: string;
  output: string;
  // Display-only metrics snapshot, denormalized from the matching AIUsageRecord
  // so the table and detail view need no join. aiUsage remains the source of
  // truth for aggregated statistics.
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  costEur: number | null;
  durationMs: number | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateAIExchangeInput {
  id: string;
  userId: string;
  projectId: string;
  usageRecordId: string | null;
  operation: AIOperationType;
  provider: string;
  model: string;
  systemPrompt: string;
  input: string;
  output: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedInputTokens?: number | null;
  costEur?: number | null;
  durationMs?: number | null;
  retentionDays: number;
}

export class AIExchange {
  private readonly props: AIExchangeProperties;

  private constructor(props: AIExchangeProperties) {
    this.props = props;
  }

  static create(input: CreateAIExchangeInput): AIExchange {
    if (input.retentionDays <= 0) {
      throw new Error('Retention window must be a positive number of days');
    }

    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() + input.retentionDays * MS_PER_DAY
    );

    return new AIExchange({
      id: input.id,
      userId: input.userId,
      projectId: input.projectId,
      usageRecordId: input.usageRecordId,
      operation: input.operation,
      provider: input.provider,
      model: input.model,
      systemPrompt: input.systemPrompt,
      input: input.input,
      output: input.output,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      cachedInputTokens: input.cachedInputTokens ?? null,
      costEur: input.costEur ?? null,
      durationMs: input.durationMs ?? null,
      createdAt,
      expiresAt,
    });
  }

  static reconstruct(props: AIExchangeProperties): AIExchange {
    return new AIExchange({ ...props });
  }

  getId(): string {
    return this.props.id;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getProjectId(): string {
    return this.props.projectId;
  }

  getUsageRecordId(): string | null {
    return this.props.usageRecordId;
  }

  getOperation(): AIOperationType {
    return this.props.operation;
  }

  getProvider(): string {
    return this.props.provider;
  }

  getModel(): string {
    return this.props.model;
  }

  getSystemPrompt(): string {
    return this.props.systemPrompt;
  }

  getInput(): string {
    return this.props.input;
  }

  getOutput(): string {
    return this.props.output;
  }

  getInputTokens(): number | null {
    return this.props.inputTokens;
  }

  getOutputTokens(): number | null {
    return this.props.outputTokens;
  }

  getCachedInputTokens(): number | null {
    return this.props.cachedInputTokens;
  }

  getCostEur(): number | null {
    return this.props.costEur;
  }

  getDurationMs(): number | null {
    return this.props.durationMs;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getExpiresAt(): Date {
    return this.props.expiresAt;
  }
}
