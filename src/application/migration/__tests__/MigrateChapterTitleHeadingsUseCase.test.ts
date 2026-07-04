// ABOUTME: Unit tests for MigrateChapterTitleHeadingsUseCase — one-shot H1 insertion per userId.
// ABOUTME: Covers dry-run, idempotency, and invalid-content resilience.

import { describe, it, expect, vi } from 'vitest';
import { MigrateChapterTitleHeadingsUseCase } from '../MigrateChapterTitleHeadingsUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

function bodyOnlyContent(): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Corps sans titre.' }] }],
  });
}

function contentWithTitre(): string {
  return JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
        content: [{ type: 'text', text: 'Déjà migré' }],
      },
    ],
  });
}

function makeChapter(id: string, title: string, content: string): Chapter {
  return new Chapter(id, title, content, 0);
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

describe('MigrateChapterTitleHeadingsUseCase', () => {
  const USER_ID = 'user-abc';

  it('returns empty report when user has no projects', async () => {
    const repo = makeRepo([]);
    const useCase = new MigrateChapterTitleHeadingsUseCase(repo);

    const report = await useCase.execute(USER_ID);

    expect(report.totalChaptersScanned).toBe(0);
    expect(report.totalChaptersMigrated).toBe(0);
    expect(report.projects).toHaveLength(0);
  });

  it('skips a chapter that already has the titre-de-chapitre heading', async () => {
    const chapter = makeChapter('ch-1', 'Chapitre Un', contentWithTitre());
    const repo = makeRepo([makeProject(USER_ID, [chapter])]);
    const useCase = new MigrateChapterTitleHeadingsUseCase(repo);

    const report = await useCase.execute(USER_ID);

    expect(repo.updateChapter).not.toHaveBeenCalled();
    expect(report.totalChaptersMigrated).toBe(0);
    expect(report.projects[0].chapters[0].wasAlreadyPresent).toBe(true);
  });

  it('inserts the heading and calls updateChapter for a chapter missing it', async () => {
    const chapter = makeChapter('ch-1', 'Chapitre Un', bodyOnlyContent());
    const repo = makeRepo([makeProject(USER_ID, [chapter])]);
    const useCase = new MigrateChapterTitleHeadingsUseCase(repo);

    const report = await useCase.execute(USER_ID);

    expect(repo.updateChapter).toHaveBeenCalledOnce();
    expect(report.totalChaptersMigrated).toBe(1);

    const [, , updatedChapter] = (repo.updateChapter as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsed = JSON.parse((updatedChapter as Chapter).getContent());
    expect(parsed.content[0]).toMatchObject({
      type: 'heading',
      attrs: { semanticRole: 'titre-de-chapitre' },
      content: [{ type: 'text', text: 'Chapitre Un' }],
    });
  });

  it('does not call updateChapter in dry-run mode', async () => {
    const chapter = makeChapter('ch-1', 'Chapitre Un', bodyOnlyContent());
    const repo = makeRepo([makeProject(USER_ID, [chapter])]);
    const useCase = new MigrateChapterTitleHeadingsUseCase(repo);

    const report = await useCase.execute(USER_ID, { dryRun: true });

    expect(repo.updateChapter).not.toHaveBeenCalled();
    expect(report.totalChaptersMigrated).toBe(1);
  });

  it('skips chapters with invalid JSON content without throwing', async () => {
    const badProject = {
      getId: () => 'proj-1',
      getTitle: () => 'Bad Project',
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
    const useCase = new MigrateChapterTitleHeadingsUseCase(repo);

    await expect(useCase.execute(USER_ID)).resolves.toBeDefined();
    expect(repo.updateChapter).not.toHaveBeenCalled();
  });

  it('aggregates counts across projects', async () => {
    const proj1 = makeProject(USER_ID, [
      makeChapter('ch-1', 'C1', bodyOnlyContent()),
      makeChapter('ch-2', 'C2', contentWithTitre()),
    ]);
    const proj2 = makeProject(USER_ID, [makeChapter('ch-3', 'C3', bodyOnlyContent())]);
    const repo = makeRepo([proj1, proj2]);
    const useCase = new MigrateChapterTitleHeadingsUseCase(repo);

    const report = await useCase.execute(USER_ID);

    expect(report.totalChaptersScanned).toBe(3);
    expect(report.totalChaptersMigrated).toBe(2);
    expect(report.projects).toHaveLength(2);
    expect(repo.updateChapter).toHaveBeenCalledTimes(2);
  });
});
