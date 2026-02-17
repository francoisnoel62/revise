// ABOUTME: Domain entity representing a complete AI request with full context for visualization
// ABOUTME: Stores prompt, analyses used, parameters, and response metadata for transparency

import { AIOperationType } from '../value-objects/AIOperationType';
import { AnalysisContext } from '../value-objects/AnalysisContext';
import { GenerationParameters } from '../value-objects/GenerationParameters';
import { PromptSnapshot } from '../value-objects/PromptSnapshot';

export interface AIRequestRecordProperties {
  id: string;
  userId: string;
  projectId: string;
  operation: AIOperationType;
  provider: string;
  model: string;
  prompt: PromptSnapshot;
  analysisContext: AnalysisContext;
  parameters: GenerationParameters;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
  responsePreview: string;  // First ~500 chars of AI response
  createdAt: Date;
}

export class AIRequestRecord {
  private readonly id: string;
  private readonly userId: string;
  private readonly projectId: string;
  private readonly operation: AIOperationType;
  private readonly provider: string;
  private readonly model: string;
  private readonly prompt: PromptSnapshot;
  private readonly analysisContext: AnalysisContext;
  private readonly parameters: GenerationParameters;
  private readonly inputTokens: number | null;
  private readonly outputTokens: number | null;
  private readonly durationMs: number;
  private readonly responsePreview: string;
  private readonly createdAt: Date;

  private constructor(props: AIRequestRecordProperties) {
    this.validateDuration(props.durationMs);
    this.validateTokens(props.inputTokens, props.outputTokens);

    this.id = props.id;
    this.userId = props.userId;
    this.projectId = props.projectId;
    this.operation = props.operation;
    this.provider = props.provider;
    this.model = props.model;
    this.prompt = props.prompt;
    this.analysisContext = props.analysisContext;
    this.parameters = props.parameters;
    this.inputTokens = props.inputTokens;
    this.outputTokens = props.outputTokens;
    this.durationMs = props.durationMs;
    this.responsePreview = props.responsePreview;
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

  static create(
    id: string,
    userId: string,
    projectId: string,
    operation: AIOperationType,
    provider: string,
    model: string,
    prompt: PromptSnapshot,
    analysisContext: AnalysisContext,
    parameters: GenerationParameters,
    inputTokens: number | null,
    outputTokens: number | null,
    durationMs: number,
    responsePreview: string
  ): AIRequestRecord {
    return new AIRequestRecord({
      id,
      userId,
      projectId,
      operation,
      provider,
      model,
      prompt,
      analysisContext,
      parameters,
      inputTokens,
      outputTokens,
      durationMs,
      responsePreview,
      createdAt: new Date(),
    });
  }

  static reconstruct(props: AIRequestRecordProperties): AIRequestRecord {
    return new AIRequestRecord(props);
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

  getPrompt(): PromptSnapshot {
    return this.prompt;
  }

  getAnalysisContext(): AnalysisContext {
    return this.analysisContext;
  }

  getParameters(): GenerationParameters {
    return this.parameters;
  }

  getInputTokens(): number | null {
    return this.inputTokens;
  }

  getOutputTokens(): number | null {
    return this.outputTokens;
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

  getResponsePreview(): string {
    return this.responsePreview;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
