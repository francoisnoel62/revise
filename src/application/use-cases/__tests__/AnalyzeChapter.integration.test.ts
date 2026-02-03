// ABOUTME: Integration test for chapter analysis use cases
// ABOUTME: Tests the complete flow from use case to repository without mocking internals

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplyCorrectionUseCase } from '../ApplyCorrectionUseCase';
import { ApplyBatchCorrectionsUseCase } from '../ApplyBatchCorrectionsUseCase';
import { IgnoreAnalysisIssueUseCase } from '../IgnoreAnalysisIssueUseCase';
import { SaveChapterAnalysisHistoryUseCase } from '../SaveChapterAnalysisHistoryUseCase';
import { ListChapterAnalysisHistoryUseCase } from '../ListChapterAnalysisHistoryUseCase';
import { ExportAnalysisReportUseCase } from '../ExportAnalysisReportUseCase';
import { ManageRepetitionExclusionsUseCase } from '../ManageRepetitionExclusionsUseCase';
import { ChapterAnalysis, ChapterAnalysisData } from '@/domain/entities/ChapterAnalysis';
import { AnalysisHistory } from '@/domain/entities/AnalysisHistory';
import { AnalysisIssue } from '@/domain/value-objects/AnalysisIssue';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import type { AnalysisRepository, IgnoredIssue, RepetitionExclusionRecord } from '@/domain/interfaces/AnalysisRepository';
import type { IdGenerator } from '@/domain/interfaces/IdGenerator';

describe('Chapter Analysis Integration', () => {
  // In-memory implementations for integration testing
  let projectRepository: ProjectRepository;
  let analysisRepository: AnalysisRepository;
  let idGenerator: IdGenerator;

  const ownerId = 'test-owner';
  const projectId = 'test-project';
  const chapterId = 'test-chapter';
  const analysisId = 'test-analysis';

  // Test data - recreated in beforeEach for isolation
  let testChapter: Chapter;
  let testProject: Project;
  let testIssue1: AnalysisIssue;
  let testIssue2: AnalysisIssue;
  let testAnalysisData: ChapterAnalysisData;
  let testAnalysis: ChapterAnalysis;

  beforeEach(() => {
    // Create fresh test data for each test
    const testContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is teh test content with some errrors.' }
          ]
        }
      ]
    });

    testChapter = new Chapter(
      chapterId,
      'Test Chapter',
      testContent,
      0
    );

    const now = new Date();
    testProject = new Project(
      projectId,
      ownerId,
      'Test Project',
      [testChapter],
      chapterId,
      null,
      now,
      now
    );

    // Positions are calculated for the TipTap JSON string
    testIssue1 = new AnalysisIssue({
      id: 'issue-1',
      category: 'spelling',
      severity: 'error',
      originalText: 'teh',
      suggestion: 'the',
      explanation: 'Typo',
      position: { start: 87, end: 90 },
      context: 'This is teh test',
    });

    testIssue2 = new AnalysisIssue({
      id: 'issue-2',
      category: 'spelling',
      severity: 'error',
      originalText: 'errrors',
      suggestion: 'errors',
      explanation: 'Typo',
      position: { start: 114, end: 121 },
      context: 'some errrors.',
    });

    testAnalysisData = {
      id: analysisId,
      chapterId,
      projectId,
      ownerId,
      categories: ['spelling'],
      styleRigor: 'moderate',
      issues: [testIssue1, testIssue2],
      repetitions: [],
      contentHash: 'test-hash',
    };

    testAnalysis = new ChapterAnalysis(testAnalysisData);

    // In-memory project repository
    const projects = new Map<string, Project>();
    projects.set(`${ownerId}-${projectId}`, testProject);

    projectRepository = {
      loadProject: vi.fn().mockImplementation(async (owner: string, id: string) => {
        return projects.get(`${owner}-${id}`) || null;
      }),
      updateProject: vi.fn().mockImplementation(async (owner: string, project: Project) => {
        projects.set(`${owner}-${project.getId()}`, project);
        return project;
      }),
      listProjects: vi.fn(),
      deleteProject: vi.fn(),
    } as unknown as ProjectRepository;

    // In-memory analysis repository
    const analyses = new Map<string, ChapterAnalysis>();
    analyses.set(`${ownerId}-${chapterId}`, testAnalysis);
    const histories = new Map<string, AnalysisHistory[]>();
    const ignoredIssues = new Map<string, IgnoredIssue[]>();
    const exclusions = new Map<string, RepetitionExclusionRecord[]>();

    analysisRepository = {
      saveAnalysis: vi.fn(),
      findAnalysisByChapterId: vi.fn().mockImplementation(async (owner: string, chapId: string) => {
        return analyses.get(`${owner}-${chapId}`) || null;
      }),
      findAnalysisByContentHash: vi.fn(),
      updateAnalysis: vi.fn().mockImplementation(async (owner: string, analysis: ChapterAnalysis) => {
        analyses.set(`${owner}-${analysis.getChapterId()}`, analysis);
      }),
      deleteAnalysis: vi.fn(),
      saveHistory: vi.fn().mockImplementation(async (owner: string, history: AnalysisHistory) => {
        const key = `${owner}-${history.getChapterId()}`;
        const list = histories.get(key) || [];
        list.push(history);
        histories.set(key, list);
      }),
      findHistoryByChapterId: vi.fn().mockImplementation(async (owner: string, chapId: string) => {
        return histories.get(`${owner}-${chapId}`) || [];
      }),
      findHistoryById: vi.fn().mockImplementation(async (owner: string, historyId: string) => {
        for (const list of histories.values()) {
          const found = list.find((h) => h.getId() === historyId);
          if (found) return found;
        }
        return null;
      }),
      updateHistory: vi.fn(),
      saveIgnoredIssue: vi.fn().mockImplementation(
        async (owner: string, chapId: string, text: string, category: string) => {
          const key = `${owner}-${chapId}`;
          const list = ignoredIssues.get(key) || [];
          list.push({
            id: `ignored-${list.length}`,
            chapterId: chapId,
            ownerId: owner,
            originalText: text,
            category: category as 'spelling',
            ignoredAt: new Date(),
          });
          ignoredIssues.set(key, list);
        }
      ),
      findIgnoredIssues: vi.fn().mockImplementation(async (owner: string, chapId: string) => {
        return ignoredIssues.get(`${owner}-${chapId}`) || [];
      }),
      removeIgnoredIssue: vi.fn(),
      saveRepetitionExclusion: vi.fn().mockImplementation(
        async (owner: string, projId: string, word: string, reason?: string) => {
          const key = `${owner}-${projId}`;
          const list = exclusions.get(key) || [];
          list.push({
            id: `excl-${list.length}`,
            projectId: projId,
            ownerId: owner,
            word: word.toLowerCase(),
            reason,
            createdAt: new Date(),
          });
          exclusions.set(key, list);
        }
      ),
      findRepetitionExclusions: vi.fn().mockImplementation(async (owner: string, projId: string) => {
        return exclusions.get(`${owner}-${projId}`) || [];
      }),
      removeRepetitionExclusion: vi.fn(),
      deleteAllByChapterId: vi.fn(),
      deleteAllByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
    } as unknown as AnalysisRepository;

    // Simple ID generator
    let idCounter = 0;
    idGenerator = {
      generate: vi.fn().mockImplementation(() => `generated-${++idCounter}`),
    };
  });

  describe('ApplyCorrectionUseCase', () => {
    it('applies a single correction and updates content', async () => {
      const useCase = new ApplyCorrectionUseCase(projectRepository, analysisRepository);

      const result = await useCase.execute({
        ownerId,
        projectId,
        chapterId,
        analysisId,
        issueId: 'issue-1',
      });

      expect(result.success).toBe(true);
      expect(result.updatedContent).toContain('the test content');
      expect(result.originalText).toBe('teh');
      expect(result.appliedText).toBe('the');
    });

    it('throws error for non-existent issue', async () => {
      const useCase = new ApplyCorrectionUseCase(projectRepository, analysisRepository);

      await expect(
        useCase.execute({
          ownerId,
          projectId,
          chapterId,
          analysisId,
          issueId: 'non-existent',
        })
      ).rejects.toThrow('Issue not found');
    });
  });

  describe('ApplyBatchCorrectionsUseCase', () => {
    it('applies multiple corrections in order', async () => {
      const useCase = new ApplyBatchCorrectionsUseCase(projectRepository, analysisRepository);

      const result = await useCase.execute({
        ownerId,
        projectId,
        chapterId,
        analysisId,
        corrections: [{ issueId: 'issue-1' }, { issueId: 'issue-2' }],
      });

      expect(result.success).toBe(true);
      expect(result.appliedCount).toBe(2);
      expect(result.updatedContent).toContain('the test content');
      expect(result.updatedContent).toContain('errors.');
    });
  });

  describe('IgnoreAnalysisIssueUseCase', () => {
    it('marks an issue as ignored', async () => {
      const useCase = new IgnoreAnalysisIssueUseCase(projectRepository, analysisRepository);

      await useCase.execute({
        ownerId,
        projectId,
        chapterId,
        analysisId,
        issueId: 'issue-1',
      });

      expect(analysisRepository.saveIgnoredIssue).toHaveBeenCalledWith(
        ownerId,
        chapterId,
        'teh',
        'spelling'
      );
    });
  });

  describe('SaveChapterAnalysisHistoryUseCase', () => {
    it('creates a history snapshot', async () => {
      const useCase = new SaveChapterAnalysisHistoryUseCase(
        projectRepository,
        analysisRepository,
        idGenerator
      );

      const result = await useCase.execute({
        ownerId,
        projectId,
        chapterId,
        analysisId,
      });

      expect(result.history).toBeDefined();
      expect(result.history.getChapterId()).toBe(chapterId);
      expect(result.history.getTotalIssuesFound()).toBe(2);
    });
  });

  describe('ListChapterAnalysisHistoryUseCase', () => {
    it('returns empty list when no history exists', async () => {
      const useCase = new ListChapterAnalysisHistoryUseCase(
        projectRepository,
        analysisRepository
      );

      const result = await useCase.execute({
        ownerId,
        projectId,
        chapterId,
      });

      expect(result.history).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('ExportAnalysisReportUseCase', () => {
    it('exports analysis as markdown', async () => {
      const useCase = new ExportAnalysisReportUseCase(projectRepository, analysisRepository);

      const result = await useCase.execute({
        ownerId,
        projectId,
        chapterId,
        analysisId,
        format: 'markdown',
      });

      expect(result.content).toContain('# Rapport de vérification');
      expect(result.content).toContain('Orthographe');
      expect(result.filename).toContain('.md');
    });

    it('exports analysis as text', async () => {
      const useCase = new ExportAnalysisReportUseCase(projectRepository, analysisRepository);

      const result = await useCase.execute({
        ownerId,
        projectId,
        chapterId,
        analysisId,
        format: 'text',
      });

      expect(result.content).toContain('RAPPORT DE VÉRIFICATION');
      expect(result.filename).toContain('.txt');
    });
  });

  describe('ManageRepetitionExclusionsUseCase', () => {
    it('adds and lists exclusions', async () => {
      const useCase = new ManageRepetitionExclusionsUseCase(
        projectRepository,
        analysisRepository
      );

      // Add exclusion
      await useCase.addExclusion({
        ownerId,
        projectId,
        word: 'TestWord',
        reason: 'Character name',
      });

      expect(analysisRepository.saveRepetitionExclusion).toHaveBeenCalledWith(
        ownerId,
        projectId,
        'testword',
        'Character name'
      );

      // List exclusions
      const result = await useCase.listExclusions({
        ownerId,
        projectId,
      });

      expect(result.exclusions.length).toBe(1);
      expect(result.exclusions[0].word).toBe('testword');
    });
  });
});
