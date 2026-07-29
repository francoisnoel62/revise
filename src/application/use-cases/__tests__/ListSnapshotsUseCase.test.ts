// ABOUTME: Unit tests for ListSnapshotsUseCase
// ABOUTME: Validates ownership checks and detection of unsnapshotted current state

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListSnapshotsUseCase } from '../ListSnapshotsUseCase';
import { Snapshot } from '../../../domain/entities/Snapshot';
import { SnapshotRepository } from '../../../domain/interfaces/SnapshotRepository';
import { ProjectRepository } from '../../../domain/interfaces/ProjectRepository';
import { ProjectSettingsRepository } from '../../../domain/interfaces/ProjectSettingsRepository';
import { Project } from '../../../domain/entities/Project';
import { Chapter } from '../../../domain/entities/Chapter';
import { ProjectSettings } from '../../../domain/entities/ProjectSettings';

describe('ListSnapshotsUseCase', () => {
  let useCase: ListSnapshotsUseCase;
  let mockSnapshotRepository: SnapshotRepository;
  let mockProjectRepository: ProjectRepository;
  let mockProjectSettingsRepository: ProjectSettingsRepository;

  const ownerId = 'user-1';
  const projectId = 'project-1';
  const chapterId = 'chapter-1';

  const createMockProject = (updatedAt: Date): Project => {
    const chapter = new Chapter(
      chapterId,
      'Chapitre 1',
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      0
    );
    return new Project(
      projectId,
      ownerId,
      'Mon roman',
      [chapter],
      chapterId,
      null,
      new Date('2026-01-01T00:00:00.000Z'),
      updatedAt
    );
  };

  const createMockSettings = (updatedAt: Date): ProjectSettings =>
    ProjectSettings.reconstruct({
      id: 'settings-1',
      projectId,
      ownerId,
      title: 'Mon roman',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt,
    });

  const createMockSnapshot = (number: number, createdAt: Date): Snapshot =>
    new Snapshot({
      id: `snapshot-${number}`,
      projectId,
      ownerId,
      authorId: ownerId,
      number,
      type: 'manual',
      title: `Version ${number}`,
      comment: null,
      projectTitle: 'Mon roman',
      chapters: [{ id: chapterId, title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 }],
      editorialMetadata: null,
      createdAt,
    });

  beforeEach(() => {
    mockSnapshotRepository = {
      getNextSequenceNumber: vi.fn().mockResolvedValue(1),
      save: vi.fn().mockResolvedValue(undefined),
      findByProjectId: vi.fn().mockResolvedValue([]),
      findLatestByProjectId: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(0),
    };

    mockProjectRepository = {
      createProject: vi.fn(),
      loadProject: vi.fn().mockResolvedValue(createMockProject(new Date('2026-01-02T00:00:00.000Z'))),
      listProjects: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      updateChapter: vi.fn(),
      replaceProjectIfUnchanged: vi.fn(),
      deleteAllByOwner: vi.fn(),
      findPublishedByToken: vi.fn(),
    };

    mockProjectSettingsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
    };

    useCase = new ListSnapshotsUseCase(
      mockSnapshotRepository,
      mockProjectRepository,
      mockProjectSettingsRepository
    );
  });

  const validInput = { ownerId, projectId };

  it('returns the snapshots for the project', async () => {
    const snapshots = [
      createMockSnapshot(2, new Date('2026-01-03T00:00:00.000Z')),
      createMockSnapshot(1, new Date('2026-01-01T12:00:00.000Z')),
    ];
    vi.mocked(mockSnapshotRepository.findByProjectId).mockResolvedValue(snapshots);
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(
      createMockProject(new Date('2026-01-03T00:00:00.000Z'))
    );

    const result = await useCase.execute(validInput);

    expect(result.snapshots).toEqual(snapshots);
  });

  it('does not make a redundant repository call to find the latest snapshot', async () => {
    await useCase.execute(validInput);

    expect(mockSnapshotRepository.findLatestByProjectId).not.toHaveBeenCalled();
  });

  it('loads only the requested page while using the latest snapshot for the current-state flag', async () => {
    const latest = createMockSnapshot(30, new Date('2026-01-03T00:00:00.000Z'));
    const pageSnapshot = createMockSnapshot(10, new Date('2026-01-02T00:00:00.000Z'));
    mockSnapshotRepository.findPageByProjectId = vi.fn().mockResolvedValue({
      snapshots: [pageSnapshot],
      nextBeforeNumber: 9,
    });
    vi.mocked(mockSnapshotRepository.findLatestByProjectId).mockResolvedValue(latest);

    const result = await useCase.execute({
      ...validInput,
      page: { type: 'manual', limit: 20 },
    });

    expect(result.snapshots).toEqual([pageSnapshot]);
    expect(result.nextBeforeNumber).toBe(9);
    expect(mockSnapshotRepository.findByProjectId).not.toHaveBeenCalled();
    expect(mockSnapshotRepository.findPageByProjectId).toHaveBeenCalledWith(
      ownerId,
      projectId,
      { type: 'manual', limit: 20 },
    );
  });

  it('flags unsnapshotted changes when no snapshot exists yet', async () => {
    vi.mocked(mockSnapshotRepository.findByProjectId).mockResolvedValue([]);

    const result = await useCase.execute(validInput);

    expect(result.hasUnsnapshottedChanges).toBe(true);
  });

  it('flags unsnapshotted changes when the project changed after the latest snapshot', async () => {
    const latest = createMockSnapshot(1, new Date('2026-01-01T00:00:00.000Z'));
    vi.mocked(mockSnapshotRepository.findByProjectId).mockResolvedValue([latest]);
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(
      createMockProject(new Date('2026-01-02T00:00:00.000Z'))
    );

    const result = await useCase.execute(validInput);

    expect(result.hasUnsnapshottedChanges).toBe(true);
  });

  it('flags unsnapshotted changes when editorial metadata changed after the latest snapshot', async () => {
    const latest = createMockSnapshot(1, new Date('2026-01-02T00:00:00.000Z'));
    vi.mocked(mockSnapshotRepository.findByProjectId).mockResolvedValue([latest]);
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(
      createMockProject(new Date('2026-01-02T00:00:00.000Z'))
    );
    vi.mocked(mockProjectSettingsRepository.findByProjectId).mockResolvedValue(
      createMockSettings(new Date('2026-01-03T00:00:00.000Z'))
    );

    const result = await useCase.execute(validInput);

    expect(result.hasUnsnapshottedChanges).toBe(true);
  });

  it('does not flag unsnapshotted changes when the latest snapshot is up to date', async () => {
    const projectUpdatedAt = new Date('2026-01-02T00:00:00.000Z');
    const latest = createMockSnapshot(1, projectUpdatedAt);
    vi.mocked(mockSnapshotRepository.findByProjectId).mockResolvedValue([latest]);
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(createMockProject(projectUpdatedAt));
    vi.mocked(mockProjectSettingsRepository.findByProjectId).mockResolvedValue(
      createMockSettings(projectUpdatedAt)
    );

    const result = await useCase.execute(validInput);

    expect(result.hasUnsnapshottedChanges).toBe(false);
  });

  it('throws if ownerId is empty', async () => {
    await expect(useCase.execute({ ...validInput, ownerId: '' })).rejects.toThrow('Owner ID is required');
  });

  it('throws if projectId is empty', async () => {
    await expect(useCase.execute({ ...validInput, projectId: '' })).rejects.toThrow('Project ID is required');
  });

  it('throws if project not found or not owned', async () => {
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow('Project not found');
  });
});
