// ABOUTME: Unit tests for MigrateProjectContentUseCase — orchestrates semantic migration per userId.
// ABOUTME: Covers dry-run, idempotency, ambiguity surfacing, and invalid-content resilience.

import { describe, it, expect, vi } from 'vitest';
import { MigrateProjectContentUseCase } from '../MigrateProjectContentUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

// Minimal legacy chapter content (has textStyle marks → needs migration)
function legacyContent(...paragraphs: Array<{ text: string; align?: string }>): string {
  return JSON.stringify({
    type: 'doc',
    content: paragraphs.map((p) => ({
      type: 'paragraph',
      attrs: { textAlign: p.align ?? 'justify' },
      content: [
        {
          type: 'text',
          text: p.text,
          marks: [{ type: 'textStyle', attrs: { fontFamily: 'Georgia', fontSize: '11pt' } }],
        },
      ],
    })),
  });
}

// Already-migrated content (has semanticRole, no textStyle marks)
function migratedContent(): string {
  return JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps' },
        content: [{ type: 'text', text: 'Already migrated.' }],
      },
    ],
  });
}

function makeChapter(id: string, content: string): Chapter {
  return new Chapter(id, `Chapter ${id}`, content, 0);
}

function makeProject(ownerId: string, chapters: Chapter[]): Project {
  return Project.create(ownerId, 'Test Project', chapters);
}

function makeRepo(projects: Project[]): ProjectRepository {
  return {
    listProjects: vi.fn().mockResolvedValue(projects),
    updateChapter: vi.fn().mockResolvedValue(undefined),
    createProject: vi.fn(),
    loadProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    deleteAllByOwner: vi.fn(),
    findPublishedByToken: vi.fn(),
  } as unknown as ProjectRepository;
}

describe('MigrateProjectContentUseCase', () => {
  const USER_ID = 'user-abc';

  describe('no projects', () => {
    it('returns empty report when user has no projects', async () => {
      const repo = makeRepo([]);
      const useCase = new MigrateProjectContentUseCase(repo);

      const report = await useCase.execute(USER_ID);

      expect(report.totalChaptersScanned).toBe(0);
      expect(report.totalChaptersMigrated).toBe(0);
      expect(report.totalAmbiguities).toBe(0);
      expect(report.projects).toHaveLength(0);
    });
  });

  describe('already-migrated content', () => {
    it('skips chapters that are already migrated', async () => {
      const chapter = makeChapter('ch-1', migratedContent());
      const project = makeProject(USER_ID, [chapter]);
      const repo = makeRepo([project]);
      const useCase = new MigrateProjectContentUseCase(repo);

      const report = await useCase.execute(USER_ID);

      expect(repo.updateChapter).not.toHaveBeenCalled();
      expect(report.totalChaptersMigrated).toBe(0);
      expect(report.projects[0].chapters[0].wasAlreadyMigrated).toBe(true);
    });
  });

  describe('legacy content (needs migration)', () => {
    it('migrates legacy chapter and calls updateChapter', async () => {
      const chapter = makeChapter('ch-1', legacyContent({ text: 'Hello world' }));
      const project = makeProject(USER_ID, [chapter]);
      const repo = makeRepo([project]);
      const useCase = new MigrateProjectContentUseCase(repo);

      const report = await useCase.execute(USER_ID);

      expect(repo.updateChapter).toHaveBeenCalledOnce();
      expect(report.totalChaptersMigrated).toBe(1);
      expect(report.projects[0].chapters[0].wasAlreadyMigrated).toBe(false);

      // Verify the updated content has semanticRole
      const [, , updatedChapter] = (repo.updateChapter as ReturnType<typeof vi.fn>).mock.calls[0];
      const parsed = JSON.parse((updatedChapter as Chapter).getContent());
      expect(parsed.content[0].attrs.semanticRole).toBe('corps');
    });

    it('reports ambiguities for centered paragraphs', async () => {
      const chapter = makeChapter(
        'ch-1',
        legacyContent({ text: 'Epigraph candidate', align: 'center' })
      );
      const project = makeProject(USER_ID, [chapter]);
      const repo = makeRepo([project]);
      const useCase = new MigrateProjectContentUseCase(repo);

      const report = await useCase.execute(USER_ID);

      expect(report.totalAmbiguities).toBe(1);
      expect(report.projects[0].chapters[0].ambiguities).toHaveLength(1);
    });
  });

  describe('dry-run mode', () => {
    it('does not call updateChapter in dry-run mode', async () => {
      const chapter = makeChapter('ch-1', legacyContent({ text: 'Body text' }));
      const project = makeProject(USER_ID, [chapter]);
      const repo = makeRepo([project]);
      const useCase = new MigrateProjectContentUseCase(repo);

      const report = await useCase.execute(USER_ID, { dryRun: true });

      expect(repo.updateChapter).not.toHaveBeenCalled();
      expect(report.totalChaptersMigrated).toBe(1);
      expect(report.projects[0].chapters[0].wasAlreadyMigrated).toBe(false);
    });
  });

  describe('resilience', () => {
    it('skips chapters with invalid JSON content without throwing', async () => {
      // Override content to bypass Chapter's validation
      // Inject via a mock project that has a bad chapter
      const badProject = {
        getId: () => 'proj-1',
        getChapters: () => [
          {
            getId: () => 'ch-bad',
            getTitle: () => 'Bad Chapter',
            getContent: () => 'not valid json {{{',
            getOrder: () => 0,
          },
        ],
      };
      const repo = {
        listProjects: vi.fn().mockResolvedValue([badProject]),
        updateChapter: vi.fn(),
      } as unknown as ProjectRepository;
      const useCase = new MigrateProjectContentUseCase(repo);

      await expect(useCase.execute(USER_ID)).resolves.toBeDefined();
      expect(repo.updateChapter).not.toHaveBeenCalled();
    });
  });

  describe('multiple projects and chapters', () => {
    it('aggregates counts across projects', async () => {
      const proj1 = makeProject(USER_ID, [
        makeChapter('ch-1', legacyContent({ text: 'P1 C1' })),
        makeChapter('ch-2', migratedContent()),
      ]);
      const proj2 = makeProject(USER_ID, [
        makeChapter('ch-3', legacyContent({ text: 'P2 C1' })),
      ]);
      const repo = makeRepo([proj1, proj2]);
      const useCase = new MigrateProjectContentUseCase(repo);

      const report = await useCase.execute(USER_ID);

      expect(report.totalChaptersScanned).toBe(3);
      expect(report.totalChaptersMigrated).toBe(2);
      expect(report.projects).toHaveLength(2);
      expect(repo.updateChapter).toHaveBeenCalledTimes(2);
    });
  });
});
