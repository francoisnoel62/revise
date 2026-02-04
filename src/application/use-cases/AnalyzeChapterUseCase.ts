// ABOUTME: Use case for analyzing a chapter for spelling, grammar, and style issues
// ABOUTME: Orchestrates multiple analysis strategies and returns results in-memory (no persistence)

import { ChapterAnalysis, ChapterAnalysisData } from '../../domain/entities/ChapterAnalysis';
import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { StyleRigor } from '../../domain/value-objects/StyleRigor';
import { AnalysisIssue } from '../../domain/value-objects/AnalysisIssue';
import { RepetitionCluster } from '../../domain/value-objects/RepetitionCluster';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { CharacterRepository } from '../../domain/interfaces/CharacterRepository';
import { IdGenerator } from '../../domain/interfaces/IdGenerator';
import { AnalysisStrategy, AnalysisOptions } from '../strategies/AnalysisStrategy';

export interface AnalyzeChapterInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
  categories: AnalysisCategory[];
  styleRigor: StyleRigor;
}

export interface AnalyzeChapterResult {
  analysis: ChapterAnalysis;
}

/**
 * Use case for analyzing a chapter for issues.
 *
 * This use case:
 * 1. Validates input and ownership
 * 2. Collects exclusions (character names)
 * 3. Executes selected analysis strategies
 * 4. Returns the ChapterAnalysis entity (in-memory only, no persistence)
 */
export class AnalyzeChapterUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly idGenerator: IdGenerator,
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

    // 4. Collect exclusions for repetition analysis (character names)
    const exclusions = await this.collectExclusions(input.ownerId, input.projectId);

    // 5. Detect language
    const language = this.detectLanguage(content);

    // 6. Prepare analysis options
    const analysisOptions: AnalysisOptions = {
      language,
      styleRigor: input.styleRigor,
      exclusions,
      ignoredTexts: [],
    };

    // 7. Execute strategies and collect issues
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

    // 8. Create ChapterAnalysis entity (in-memory only)
    const analysisData: ChapterAnalysisData = {
      id: this.idGenerator.generate(),
      chapterId: input.chapterId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      categories: input.categories,
      styleRigor: input.styleRigor,
      issues,
      repetitions,
      contentHash: 'in-memory',
    };

    const analysis = new ChapterAnalysis(analysisData);

    return {
      analysis,
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
