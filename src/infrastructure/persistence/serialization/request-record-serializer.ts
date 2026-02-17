// ABOUTME: Serialization utilities for AIRequestRecord <-> MongoDB document conversion
// ABOUTME: Handles nested value objects and Date conversions for request visualization data

import { AIRequestRecord, AIRequestRecordProperties } from '@/domain/entities/AIRequestRecord';
import { AnalysisContext, AnalysisContextEntry } from '@/domain/value-objects/AnalysisContext';
import { GenerationParameters } from '@/domain/value-objects/GenerationParameters';
import { PromptSnapshot } from '@/domain/value-objects/PromptSnapshot';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';

/**
 * MongoDB document shape for AIRequestRecord.
 */
export interface AIRequestDocument {
  _id: string;
  userId: string;
  projectId: string;
  operation: string;
  provider: string;
  model: string;
  prompt: {
    systemPrompt: string;
    userMessage: string;
    humanReadableSummary: string;
  };
  analysisContext: {
    entries: Array<{
      typeKey: string;
      label: string;
      present: boolean;
      summary?: string;
      colorCode: string;
    }>;
    totalAvailable: number;
    totalPossible: number;
  };
  parameters: {
    temperature: number | null;
    maxTokens: number;
    thinkingBudget: number;
    thinkingEnabled: boolean;
  };
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
  responsePreview: string;
  createdAt: Date;
}

/**
 * Convert AIRequestRecord domain entity to MongoDB document.
 */
export function serializeRequestRecord(record: AIRequestRecord): AIRequestDocument {
  const prompt = record.getPrompt();
  const context = record.getAnalysisContext();
  const parameters = record.getParameters();

  return {
    _id: record.getId(),
    userId: record.getUserId(),
    projectId: record.getProjectId(),
    operation: record.getOperation(),
    provider: record.getProvider(),
    model: record.getModel(),
    prompt: {
      systemPrompt: prompt.systemPrompt,
      userMessage: prompt.userMessage,
      humanReadableSummary: prompt.humanReadableSummary,
    },
    analysisContext: {
      entries: context.entries.map((entry) => ({
        typeKey: entry.typeKey,
        label: entry.label,
        present: entry.present,
        summary: entry.summary,
        colorCode: entry.colorCode,
      })),
      totalAvailable: context.totalAvailable,
      totalPossible: context.totalPossible,
    },
    parameters: {
      temperature: parameters.temperature,
      maxTokens: parameters.maxTokens,
      thinkingBudget: parameters.thinkingBudget,
      thinkingEnabled: parameters.thinkingEnabled,
    },
    inputTokens: record.getInputTokens(),
    outputTokens: record.getOutputTokens(),
    durationMs: record.getDurationMs(),
    responsePreview: record.getResponsePreview(),
    createdAt: record.getCreatedAt(),
  };
}

/**
 * Reconstruct AIRequestRecord domain entity from MongoDB document.
 */
export function deserializeRequestRecord(doc: AIRequestDocument): AIRequestRecord {
  const prompt: PromptSnapshot = {
    systemPrompt: doc.prompt.systemPrompt,
    userMessage: doc.prompt.userMessage,
    humanReadableSummary: doc.prompt.humanReadableSummary,
  };

  const entries: AnalysisContextEntry[] = doc.analysisContext.entries.map((entry) => ({
    typeKey: entry.typeKey,
    label: entry.label,
    present: entry.present,
    summary: entry.summary,
    colorCode: entry.colorCode,
  }));

  const analysisContext: AnalysisContext = {
    entries,
    totalAvailable: doc.analysisContext.totalAvailable,
    totalPossible: doc.analysisContext.totalPossible,
  };

  const parameters: GenerationParameters = {
    temperature: doc.parameters.temperature,
    maxTokens: doc.parameters.maxTokens,
    thinkingBudget: doc.parameters.thinkingBudget,
    thinkingEnabled: doc.parameters.thinkingEnabled,
  };

  const props: AIRequestRecordProperties = {
    id: doc._id,
    userId: doc.userId,
    projectId: doc.projectId,
    operation: doc.operation as AIOperationType,
    provider: doc.provider,
    model: doc.model,
    prompt,
    analysisContext,
    parameters,
    inputTokens: doc.inputTokens,
    outputTokens: doc.outputTokens,
    durationMs: doc.durationMs,
    responsePreview: doc.responsePreview,
    createdAt: new Date(doc.createdAt),
  };

  return AIRequestRecord.reconstruct(props);
}
