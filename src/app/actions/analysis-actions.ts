// ABOUTME: Server Actions for chapter analysis/verification feature.
// ABOUTME: Provides AI-powered grammar, punctuation, style, and repetition analysis.

'use server';

import {
  ActionResult,
  getAuthenticatedUserId,
  withErrorHandling,
  getRepository,
  getIdGenerator,
  getCharacterRepo,
  getProviderRepo,
} from './utils';
import { AnalyzeChapterUseCase } from '@/application/use-cases/AnalyzeChapterUseCase';
import { ApplyCorrectionUseCase, CorrectionIssue } from '@/application/use-cases/ApplyCorrectionUseCase';
import { ApplyBatchCorrectionsUseCase, BatchCorrectionIssue } from '@/application/use-cases/ApplyBatchCorrectionsUseCase';
import { GrammarAnalysisStrategy } from '@/application/strategies/GrammarAnalysisStrategy';
import { PunctuationAnalysisStrategy } from '@/application/strategies/PunctuationAnalysisStrategy';
import { StyleAnalysisStrategy } from '@/application/strategies/StyleAnalysisStrategy';
import { RepetitionAnalysisStrategy } from '@/application/strategies/RepetitionAnalysisStrategy';
import { createAnalysisLLMClient } from '@/infrastructure/ai/AnalysisLLMClient';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import { StyleRigor } from '@/domain/value-objects/StyleRigor';
import type { AnalysisIssue as DomainAnalysisIssue } from '@/domain/value-objects/AnalysisIssue';
import type { RepetitionCluster } from '@/domain/value-objects/RepetitionCluster';
import type { AnalysisStrategy } from '@/application/strategies/AnalysisStrategy';

// DTOs for server actions
export interface AnalysisIssueDTO {
  id: string;
  category: AnalysisCategory;
  severity: 'error' | 'warning' | 'suggestion';
  originalText: string;
  suggestedText: string;
  explanation?: string;
  context?: string;
  position: { start: number; end: number };
  status: 'pending' | 'applied' | 'ignored';
}

export interface RepetitionClusterDTO {
  word: string;
  count: number;
  positions: Array<{ start: number; end: number }>;
  suggestions: string[];
}

export interface AnalysisResultDTO {
  analysisId: string;
  issues: AnalysisIssueDTO[];
  repetitions: RepetitionClusterDTO[];
  stats: {
    totalIssues: number;
    byCategory: Record<AnalysisCategory, number>;
    bySeverity: Record<string, number>;
  };
}

// Mappers
function mapIssueToDTO(issue: DomainAnalysisIssue): AnalysisIssueDTO {
  return {
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    originalText: issue.originalText,
    suggestedText: issue.suggestion,
    explanation: issue.explanation,
    context: issue.context,
    position: { start: issue.position.start, end: issue.position.end },
    status: issue.status,
  };
}

function mapRepetitionToDTO(cluster: RepetitionCluster): RepetitionClusterDTO {
  return {
    word: cluster.word,
    count: cluster.getCount(),
    positions: cluster.positions.map((p) => ({ start: p.start, end: p.end })),
    suggestions: [...cluster.suggestions],
  };
}

function mapDTOToCorrectionIssue(dto: AnalysisIssueDTO): CorrectionIssue {
  return {
    originalText: dto.originalText,
    suggestion: dto.suggestedText,
    context: dto.context,
  };
}

function mapDTOToBatchCorrectionIssue(dto: AnalysisIssueDTO): BatchCorrectionIssue {
  return {
    id: dto.id,
    originalText: dto.originalText,
    suggestion: dto.suggestedText,
    context: dto.context,
  };
}

/**
 * Analyze a chapter for issues across multiple categories.
 * Results are returned in-memory only (no persistence).
 */
export async function analyzeChapter(
  projectId: string,
  chapterId: string,
  categories: AnalysisCategory[],
  styleRigor: StyleRigor = 'moderate'
): Promise<ActionResult<AnalysisResultDTO>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const characterRepo = await getCharacterRepo();
    const idGenerator = await getIdGenerator();

    // Get the project to verify it exists
    const project = await projectRepo.loadProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const chapter = project.getChapters().find((c) => c.getId() === chapterId);
    if (!chapter) throw new Error('Chapter not found');

    // Get the project's configured provider
    const providerId = project.getProviderId();
    if (!providerId) {
      throw new Error(
        'Aucun fournisseur IA configuré pour ce projet. Veuillez en sélectionner un dans les paramètres du projet.'
      );
    }

    const providerRepo = await getProviderRepo();
    const provider = await providerRepo.findById(userId, providerId);
    if (!provider) {
      throw new Error(
        'Le fournisseur IA configuré est introuvable. Veuillez en sélectionner un autre.'
      );
    }

    if (!provider.isValidProvider()) {
      throw new Error(
        'Le fournisseur IA configuré est invalide. Veuillez tester la connexion ou en choisir un autre.'
      );
    }

    // Create analysis LLM client with project's provider
    const analysisClient = createAnalysisLLMClient(
      provider.getType(),
      provider.getApiKey(),
      provider.getModel()
    );

    // Create strategies based on requested categories
    const strategiesMap = new Map<AnalysisCategory, AnalysisStrategy>();
    for (const category of categories) {
      switch (category) {
        case 'grammar':
          strategiesMap.set(category, new GrammarAnalysisStrategy(analysisClient));
          break;
        case 'punctuation':
          strategiesMap.set(category, new PunctuationAnalysisStrategy(analysisClient));
          break;
        case 'style':
          strategiesMap.set(category, new StyleAnalysisStrategy(analysisClient));
          break;
        case 'repetition':
          strategiesMap.set(category, new RepetitionAnalysisStrategy(analysisClient));
          break;
      }
    }

    const useCase = new AnalyzeChapterUseCase(
      projectRepo,
      characterRepo,
      idGenerator,
      strategiesMap
    );

    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      categories,
      styleRigor,
    });

    const analysis = result.analysis;
    const issues = analysis.getIssues();
    const repetitions = analysis.getRepetitions();

    // Compute stats
    const byCategory: Record<AnalysisCategory, number> = {
      spelling: 0,
      grammar: 0,
      punctuation: 0,
      repetition: 0,
      style: 0,
    };
    const bySeverity: Record<string, number> = {
      error: 0,
      warning: 0,
      suggestion: 0,
    };

    for (const issue of issues) {
      byCategory[issue.category]++;
      bySeverity[issue.severity]++;
    }

    return {
      analysisId: analysis.getId(),
      issues: issues.map(mapIssueToDTO),
      repetitions: repetitions.map(mapRepetitionToDTO),
      stats: {
        totalIssues: issues.length,
        byCategory,
        bySeverity,
      },
    };
  });
}

/**
 * Apply a single correction to the chapter content.
 * The issue is passed directly since analysis is in-memory only.
 */
export async function applyCorrection(
  projectId: string,
  chapterId: string,
  issue: AnalysisIssueDTO
): Promise<ActionResult<{ newContent: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();

    const useCase = new ApplyCorrectionUseCase(projectRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      issue: mapDTOToCorrectionIssue(issue),
    });

    return { newContent: result.updatedContent };
  });
}

/**
 * Apply multiple corrections in batch.
 * Issues are passed directly since analysis is in-memory only.
 */
export async function applyBatchCorrections(
  projectId: string,
  chapterId: string,
  issues: AnalysisIssueDTO[]
): Promise<ActionResult<{ newContent: string; appliedCount: number }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();

    const useCase = new ApplyBatchCorrectionsUseCase(projectRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      issues: issues.map(mapDTOToBatchCorrectionIssue),
    });

    return {
      newContent: result.updatedContent,
      appliedCount: result.appliedCount,
    };
  });
}
