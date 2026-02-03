// ABOUTME: Server Actions for chapter analysis/verification feature.
// ABOUTME: Provides AI-powered spelling, grammar, punctuation, style, and repetition analysis.

'use server';

import {
  ActionResult,
  getAuthenticatedUserId,
  withErrorHandling,
  getRepository,
  getAnalysisRepo,
  getIdGenerator,
  getCharacterRepo,
} from './utils';
import { AnalyzeChapterUseCase, HashService } from '@/application/use-cases/AnalyzeChapterUseCase';
import { ApplyCorrectionUseCase } from '@/application/use-cases/ApplyCorrectionUseCase';
import { ApplyBatchCorrectionsUseCase } from '@/application/use-cases/ApplyBatchCorrectionsUseCase';
import { IgnoreAnalysisIssueUseCase } from '@/application/use-cases/IgnoreAnalysisIssueUseCase';
import { SaveChapterAnalysisHistoryUseCase } from '@/application/use-cases/SaveChapterAnalysisHistoryUseCase';
import { ListChapterAnalysisHistoryUseCase } from '@/application/use-cases/ListChapterAnalysisHistoryUseCase';
import { GetAnalysisDiffUseCase } from '@/application/use-cases/GetAnalysisDiffUseCase';
import { ExportAnalysisReportUseCase } from '@/application/use-cases/ExportAnalysisReportUseCase';
import { ManageRepetitionExclusionsUseCase } from '@/application/use-cases/ManageRepetitionExclusionsUseCase';
import { SpellingAnalysisStrategy } from '@/application/strategies/SpellingAnalysisStrategy';
import { GrammarAnalysisStrategy } from '@/application/strategies/GrammarAnalysisStrategy';
import { PunctuationAnalysisStrategy } from '@/application/strategies/PunctuationAnalysisStrategy';
import { StyleAnalysisStrategy } from '@/application/strategies/StyleAnalysisStrategy';
import { RepetitionAnalysisStrategy } from '@/application/strategies/RepetitionAnalysisStrategy';
import { OpenAIAnalysisLLMClient } from '@/infrastructure/ai/AnalysisLLMClient';
import { ContentHashService } from '@/infrastructure/services/ContentHashService';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import { StyleRigor } from '@/domain/value-objects/StyleRigor';
import type { AnalysisIssue } from '@/domain/value-objects/AnalysisIssue';
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

export interface AnalysisHistoryDTO {
  id: string;
  chapterId: string;
  projectId: string;
  originalContent: string;
  totalIssuesFound: number;
  categoriesAnalyzed: AnalysisCategory[];
  appliedCorrections: number;
  ignoredIssues: number;
  createdAt: string;
}

export interface DiffResultDTO {
  originalContent: string;
  currentContent: string;
  diff: { type: 'unchanged' | 'removed' | 'added'; text: string }[];
  changeCount: number;
}

// Mappers
function mapIssueToDTO(issue: AnalysisIssue): AnalysisIssueDTO {
  return {
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    originalText: issue.originalText,
    suggestedText: issue.suggestion,
    explanation: issue.explanation,
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

/**
 * Analyze a chapter for issues across multiple categories.
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
    const analysisRepo = await getAnalysisRepo();
    const characterRepo = await getCharacterRepo();
    const idGenerator = await getIdGenerator();

    // Get the project to verify it exists
    const project = await projectRepo.loadProject(userId, projectId);
    if (!project) throw new Error('Project not found');

    const chapter = project.getChapters().find((c) => c.getId() === chapterId);
    if (!chapter) throw new Error('Chapter not found');

    // Create analysis LLM client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
    const analysisClient = new OpenAIAnalysisLLMClient(apiKey);

    // Create strategies based on requested categories
    const strategiesMap = new Map<AnalysisCategory, AnalysisStrategy>();
    for (const category of categories) {
      switch (category) {
        case 'spelling':
          strategiesMap.set(category, new SpellingAnalysisStrategy(analysisClient));
          break;
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

    const hashService: HashService = new ContentHashService();

    const useCase = new AnalyzeChapterUseCase(
      projectRepo,
      analysisRepo,
      characterRepo,
      idGenerator,
      hashService,
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
 */
export async function applyCorrection(
  projectId: string,
  chapterId: string,
  analysisId: string,
  issueId: string
): Promise<ActionResult<{ newContent: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ApplyCorrectionUseCase(projectRepo, analysisRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      analysisId,
      issueId,
    });

    return { newContent: result.updatedContent };
  });
}

/**
 * Apply multiple corrections in batch.
 */
export async function applyBatchCorrections(
  projectId: string,
  chapterId: string,
  analysisId: string,
  issueIds: string[]
): Promise<ActionResult<{ newContent: string; appliedCount: number }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ApplyBatchCorrectionsUseCase(projectRepo, analysisRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      analysisId,
      corrections: issueIds.map((id) => ({ issueId: id })),
    });

    return {
      newContent: result.updatedContent,
      appliedCount: result.appliedCount,
    };
  });
}

/**
 * Ignore an analysis issue.
 */
export async function ignoreIssue(
  projectId: string,
  chapterId: string,
  analysisId: string,
  issueId: string
): Promise<ActionResult<{ success: boolean }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new IgnoreAnalysisIssueUseCase(projectRepo, analysisRepo);
    await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      analysisId,
      issueId,
    });

    return { success: true };
  });
}

/**
 * Save analysis history snapshot.
 */
export async function saveAnalysisHistory(
  projectId: string,
  chapterId: string,
  analysisId: string
): Promise<ActionResult<AnalysisHistoryDTO>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();
    const idGenerator = await getIdGenerator();

    const useCase = new SaveChapterAnalysisHistoryUseCase(
      projectRepo,
      analysisRepo,
      idGenerator
    );

    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      analysisId,
    });

    const history = result.history;
    return {
      id: history.getId(),
      chapterId: history.getChapterId(),
      projectId: history.getProjectId(),
      originalContent: history.getOriginalContent(),
      totalIssuesFound: history.getTotalIssuesFound(),
      categoriesAnalyzed: history.getCategoriesAnalyzed(),
      appliedCorrections: history.getAppliedCount(),
      ignoredIssues: history.getIgnoredCount(),
      createdAt: history.getCreatedAt().toISOString(),
    };
  });
}

/**
 * List analysis history for a chapter.
 */
export async function listAnalysisHistory(
  projectId: string,
  chapterId: string
): Promise<ActionResult<AnalysisHistoryDTO[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ListChapterAnalysisHistoryUseCase(projectRepo, analysisRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
    });

    return result.history.map((h) => ({
      id: h.getId(),
      chapterId: h.getChapterId(),
      projectId: h.getProjectId(),
      originalContent: h.getOriginalContent(),
      totalIssuesFound: h.getTotalIssuesFound(),
      categoriesAnalyzed: h.getCategoriesAnalyzed(),
      appliedCorrections: h.getAppliedCount(),
      ignoredIssues: h.getIgnoredCount(),
      createdAt: h.getCreatedAt().toISOString(),
    }));
  });
}

/**
 * Get diff between history snapshot and current content.
 */
export async function getAnalysisDiff(
  projectId: string,
  chapterId: string,
  historyId: string
): Promise<ActionResult<DiffResultDTO>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new GetAnalysisDiffUseCase(projectRepo, analysisRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      historyId,
    });

    return {
      originalContent: result.originalContent,
      currentContent: result.currentContent,
      diff: result.diff,
      changeCount: result.changeCount,
    };
  });
}

/**
 * Export analysis report as text or markdown.
 */
export async function exportAnalysisReport(
  projectId: string,
  chapterId: string,
  analysisId: string,
  format: 'text' | 'markdown' = 'markdown'
): Promise<ActionResult<{ content: string; filename: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ExportAnalysisReportUseCase(projectRepo, analysisRepo);
    const result = await useCase.execute({
      ownerId: userId,
      projectId,
      chapterId,
      analysisId,
      format,
    });

    return {
      content: result.content,
      filename: result.filename,
    };
  });
}

/**
 * Add a word to repetition exclusions.
 */
export async function addRepetitionExclusion(
  projectId: string,
  word: string,
  reason?: string
): Promise<ActionResult<{ success: boolean }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ManageRepetitionExclusionsUseCase(projectRepo, analysisRepo);
    await useCase.addExclusion({
      ownerId: userId,
      projectId,
      word,
      reason,
    });

    return { success: true };
  });
}

/**
 * Remove a word from repetition exclusions.
 */
export async function removeRepetitionExclusion(
  projectId: string,
  word: string
): Promise<ActionResult<{ success: boolean }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ManageRepetitionExclusionsUseCase(projectRepo, analysisRepo);
    await useCase.removeExclusion({
      ownerId: userId,
      projectId,
      word,
    });

    return { success: true };
  });
}

/**
 * List all repetition exclusions for a project.
 */
export async function listRepetitionExclusions(
  projectId: string
): Promise<ActionResult<{ word: string; reason?: string; createdAt: string }[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;
  const { userId } = auth;

  return withErrorHandling(async () => {
    const projectRepo = await getRepository();
    const analysisRepo = await getAnalysisRepo();

    const useCase = new ManageRepetitionExclusionsUseCase(projectRepo, analysisRepo);
    const result = await useCase.listExclusions({
      ownerId: userId,
      projectId,
    });

    return result.exclusions.map((e) => ({
      word: e.word,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
    }));
  });
}
