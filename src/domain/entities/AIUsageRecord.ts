// ABOUTME: AIUsageRecord entity representing a single AI operation for usage tracking
// ABOUTME: Stores provider, model, tokens, duration, and operation type

import { AIOperationType } from '../value-objects/AIOperationType';

export interface AIUsageRecordProperties {
  id: string;
  userId: string;
  projectId: string;
  operation: AIOperationType;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens?: number | null;
  costEur?: number | null;
  durationMs: number;
  createdAt: Date;
}

export class AIUsageRecord {
  private readonly id: string;
  private readonly userId: string;
  private readonly projectId: string;
  private readonly operation: AIOperationType;
  private readonly provider: string;
  private readonly model: string;
  private readonly inputTokens: number | null;
  private readonly outputTokens: number | null;
  private readonly cachedInputTokens: number | null;
  private readonly costEur: number | null;
  private readonly durationMs: number;
  private readonly createdAt: Date;

  private constructor(props: AIUsageRecordProperties) {
    this.validateDuration(props.durationMs);
    this.validateTokens(props.inputTokens, props.outputTokens);
    this.validateCachedTokens(props.cachedInputTokens ?? null);

    this.id = props.id;
    this.userId = props.userId;
    this.projectId = props.projectId;
    this.operation = props.operation;
    this.provider = props.provider;
    this.model = props.model;
    this.inputTokens = props.inputTokens;
    this.outputTokens = props.outputTokens;
    this.cachedInputTokens = props.cachedInputTokens ?? null;
    this.costEur = props.costEur ?? null;
    this.durationMs = props.durationMs;
    this.createdAt = props.createdAt;
  }

  private validateDuration(durationMs: number): void {
    if (durationMs < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  private validateTokens(input: number | null, output: number | null): void {
    if (input !== null && input < 0) {
      throw new Error('Input tokens cannot be negative');
    }
    if (output !== null && output < 0) {
      throw new Error('Output tokens cannot be negative');
    }
  }

  private validateCachedTokens(cached: number | null): void {
    if (cached !== null && cached < 0) {
      throw new Error('Cached input tokens cannot be negative');
    }
  }

  static create(
    id: string,
    userId: string,
    projectId: string,
    operation: AIOperationType,
    provider: string,
    model: string,
    inputTokens: number | null,
    outputTokens: number | null,
    durationMs: number,
    cachedInputTokens: number | null = null,
    costEur: number | null = null
  ): AIUsageRecord {
    return new AIUsageRecord({
      id,
      userId,
      projectId,
      operation,
      provider,
      model,
      inputTokens,
      outputTokens,
      cachedInputTokens,
      costEur,
      durationMs,
      createdAt: new Date(),
    });
  }

  static reconstruct(props: AIUsageRecordProperties): AIUsageRecord {
    return new AIUsageRecord(props);
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOperation(): AIOperationType {
    return this.operation;
  }

  getProvider(): string {
    return this.provider;
  }

  getModel(): string {
    return this.model;
  }

  getInputTokens(): number | null {
    return this.inputTokens;
  }

  getOutputTokens(): number | null {
    return this.outputTokens;
  }

  getCachedInputTokens(): number | null {
    return this.cachedInputTokens;
  }

  getCostEur(): number | null {
    return this.costEur;
  }

  getTotalTokens(): number | null {
    if (this.inputTokens === null && this.outputTokens === null) {
      return null;
    }
    return (this.inputTokens ?? 0) + (this.outputTokens ?? 0);
  }

  getDurationMs(): number {
    return this.durationMs;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
