// ABOUTME: Use case for analyzing a chapter for spelling, grammar, and style issues
// ABOUTME: Orchestrates multiple analysis strategies and manages caching

import { ChapterAnalysis, ChapterAnalysisData } from '../../domain/entities/ChapterAnalysis';
import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { StyleRigor } from '../../domain/value-objects/StyleRigor';
import { AnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { RepetitionCluster } from '../../domain/value-objects/RepetitionCluster';
import { AnalysisRepository } from '../../domain/interfaces/AnalysisRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { CharacterRepository } from '../../domain/interfaces/CharacterRepository';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';
import { AnalysisStrategy, AnalysisOptions } from '../strategies/AnalysisStrategy';

/**
 * Service for computing content hashes
 */
export interface HashService {
  hash(content: string): string;
}

export interface AnalyzeChapterInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  categories: AnalysisCategory[];
  styleRigor: StyleRigor;
}

export interface AnalyzeChapterResult {
  analysis: ChapterAnalysis;
  fromCache: boolean;
}

/**
 * Use case for analyzing a chapter for issues.
 *
 * This use case:
 * 1. Validates input and ownership
 * 2. Checks cache for existing analysis
 * 3. Collects exclusions (character names, user-defined words)
 * 4. Executes selected analysis strategies
 * 5. Creates and saves the ChapterAnalysis entity
 */
export class AnalyzeChapterUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly analysisRepository: AnalysisRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly idGenerator: IdGenerator,
    private readonly hashService: HashService,
    private readonly strategies: Map<AnalysisCategory, AnalysisStrategy>
  ) {}

  async execute(input: AnalyzeChapterInput): Promise<AnalyzeChapterResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Load project and verify ownership
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Find chapter
    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    const content = chapter.getContent();
    const contentHash = this.hashService.hash(content);

    // 4. Check cache
    const cachedAnalysis = await this.analysisRepository.findAnalysisByContentHash(
      input.ownerId,
      input.chapterId,
      contentHash
    );

    if (cachedAnalysis) {
      return {
        analysis: cachedAnalysis as unknown as ChapterAnalysis,
        fromCache: true,
      };
    }

    // 5. Collect exclusions for repetition analysis
    const exclusions = await this.collectExclusions(input.ownerId, input.projectId);

    // 6. Collect previously ignored texts
    const ignoredIssues = await this.analysisRepository.findIgnoredIssues(
      input.ownerId,
      input.chapterId
    );
    const ignoredTexts = ignoredIssues.map((i) => i.originalText);

    // 7. Detect language
    const language = this.detectLanguage(content);

    // 8. Prepare analysis options
    const analysisOptions: AnalysisOptions = {
      language,
      styleRigor: input.styleRigor,
      exclusions,
      ignoredTexts,
    };

    // 9. Execute strategies and collect issues
    const issues: AnalysisIssue[] = [];
    const repetitions: RepetitionCluster[] = [];

    for (const category of input.categories) {
      const strategy = this.strategies.get(category);
      if (!strategy) {
        continue;
      }

      // Collect issues from strategy
      for await (const issue of strategy.analyze(content, analysisOptions)) {
        issues.push(issue);
      }
    }

    // 10. Create ChapterAnalysis entity
    const analysisData: ChapterAnalysisData = {
      id: this.idGenerator.generate(),
      chapterId: input.chapterId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      categories: input.categories,
      styleRigor: input.styleRigor,
      issues,
      repetitions,
      contentHash,
    };

    const analysis = new ChapterAnalysis(analysisData);

    // 11. Save to repository
    await this.analysisRepository.saveAnalysis(input.ownerId, analysis);

    return {
      analysis,
      fromCache: false,
    };
  }

  private validateInput(input: AnalyzeChapterInput): void {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new Error('Chapter ID is required');
    }

    if (!input.categories || input.categories.length === 0) {
      throw new Error('At least one category is required');
    }
  }

  private async collectExclusions(
    ownerId: string,
    projectId: string
  ): Promise<string[]> {
    const exclusions: string[] = [];

    // Get character names
    const characters = await this.characterRepository.findByProjectId(ownerId, projectId);
    for (const character of characters) {
      exclusions.push(character.getName());
    }

    // Get user-defined exclusions
    const userExclusions = await this.analysisRepository.findRepetitionExclusions(
      ownerId,
      projectId
    );
    for (const exclusion of userExclusions) {
      exclusions.push(exclusion.word);
    }

    return exclusions;
  }

  private detectLanguage(content: string): 'fr' | 'en' {
    // Simple heuristic: check for French-specific patterns
    const frenchPatterns = [
      /[àâäéèêëïîôùûüç]/i,
      /\b(le|la|les|un|une|des|et|est|sont|ont|dans|pour|avec|sur|par)\b/i,
      /\b(je|tu|il|elle|nous|vous|ils|elles)\b/i,
    ];

    const frenchMatches = frenchPatterns.filter((pattern) =>
      pattern.test(content)
    ).length;

    return frenchMatches >= 2 ? 'fr' : 'en';
  }
}
