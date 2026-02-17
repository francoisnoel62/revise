// ABOUTME: Server Actions for AI Request Visualization feature
// ABOUTME: Provides endpoints for fetching request records and project history

'use server';

import { GetRequestVisualizationUseCase } from '@/application/use-cases/GetRequestVisualizationUseCase';
import { ListRequestHistoryUseCase } from '@/application/use-cases/ListRequestHistoryUseCase';
import { AnalysisContextEntry } from '@/domain/value-objects/AnalysisContext';
import {
  ActionResult,
  getAuthenticatedUserId,
  getAIRequestRepo,
  withErrorHandling,
} from './utils';

/**
 * Serialized form of AIRequestRecord safe for client transport.
 * All Dates converted to ISO strings.
 */
export interface SerializedRequestRecord {
  id: string;
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
  totalTokens: number | null;
  durationMs: number;
  responsePreview: string;
  createdAt: string;
}

/**
 * Fetch a single AI request record for visualization.
 *
 * @param requestRecordId The ID of the request record to fetch
 */
export async function getRequestVisualizationAction(
  requestRecordId: string
): Promise<ActionResult<SerializedRequestRecord>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const requestRepo = await getAIRequestRepo();
    const useCase = new GetRequestVisualizationUseCase(requestRepo);

    const record = await useCase.execute({
      ownerId: auth.userId,
      requestRecordId,
    });

    if (!record) {
      throw new Error('Request record not found');
    }

    const analysisContext = record.getAnalysisContext();
    const entries: AnalysisContextEntry[] = analysisContext.entries;

    const serialized: SerializedRequestRecord = {
      id: record.getId(),
      operation: record.getOperation(),
      provider: record.getProvider(),
      model: record.getModel(),
      prompt: record.getPrompt(),
      analysisContext: {
        entries: entries.map((e) => ({
          typeKey: e.typeKey,
          label: e.label,
          present: e.present,
          summary: e.summary,
          colorCode: e.colorCode,
        })),
        totalAvailable: analysisContext.totalAvailable,
        totalPossible: analysisContext.totalPossible,
      },
      parameters: record.getParameters(),
      inputTokens: record.getInputTokens(),
      outputTokens: record.getOutputTokens(),
      totalTokens: record.getTotalTokens(),
      durationMs: record.getDurationMs(),
      responsePreview: record.getResponsePreview(),
      createdAt: record.getCreatedAt().toISOString(),
    };

    return serialized;
  });
}

/**
 * List AI request history for a project.
 *
 * @param projectId The project to fetch history for
 * @param limit Maximum number of records to return (default 50)
 * @param offset Number of records to skip for pagination (default 0)
 */
export async function listRequestHistoryAction(
  projectId: string,
  limit?: number,
  offset?: number
): Promise<ActionResult<SerializedRequestRecord[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const requestRepo = await getAIRequestRepo();
    const useCase = new ListRequestHistoryUseCase(requestRepo);

    const records = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      limit,
      offset,
    });

    return records.map((record) => {
      const analysisContext = record.getAnalysisContext();
      const entries: AnalysisContextEntry[] = analysisContext.entries;

      return {
        id: record.getId(),
        operation: record.getOperation(),
        provider: record.getProvider(),
        model: record.getModel(),
        prompt: record.getPrompt(),
        analysisContext: {
          entries: entries.map((e) => ({
            typeKey: e.typeKey,
            label: e.label,
            present: e.present,
            summary: e.summary,
            colorCode: e.colorCode,
          })),
          totalAvailable: analysisContext.totalAvailable,
          totalPossible: analysisContext.totalPossible,
        },
        parameters: record.getParameters(),
        inputTokens: record.getInputTokens(),
        outputTokens: record.getOutputTokens(),
        totalTokens: record.getTotalTokens(),
        durationMs: record.getDurationMs(),
        responsePreview: record.getResponsePreview(),
        createdAt: record.getCreatedAt().toISOString(),
      } satisfies SerializedRequestRecord;
    });
  });
}
