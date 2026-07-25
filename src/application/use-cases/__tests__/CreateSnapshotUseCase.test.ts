// ABOUTME: Unit tests for CreateSnapshotUseCase
// ABOUTME: Validates ownership, sequential numbering, and the captured manuscript payload

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSnapshotUseCase } from '../CreateSnapshotUseCase';
import { Snapshot } from '../../../domain/entities/Snapshot';
import { SnapshotRepository } from '../../../domain/interfaces/SnapshotRepository';
import { ProjectRepository } from '../../../domain/interfaces/ProjectRepository';
import { ProjectSettingsRepository } from '../../../domain/interfaces/ProjectSettingsRepository';
import { IdGenerator } from '../../../domain/interfaces/IdGenerator';
import { Project } from '../../../domain/entities/Project';
import { Chapter } from '../../../domain/entities/Chapter';
import { ProjectSettings } from '../../../domain/entities/ProjectSettings';

describe('CreateSnapshotUseCase', () => {
  let useCase: CreateSnapshotUseCase;
  let mockSnapshotRepository: SnapshotRepository;
  let mockProjectRepository: ProjectRepository;
  let mockProjectSettingsRepository: ProjectSettingsRepository;
  let mockIdGenerator: IdGenerator;

  const ownerId = 'user-1';
  const projectId = 'project-1';
  const chapterId = 'chapter-1';

  const createMockProject = (): Project => {
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
      new Date('2026-01-02T00:00:00.000Z')
    );
  };

  const createMockSettings = (): ProjectSettings =>
    ProjectSettings.create('settings-1', projectId, ownerId, 'Mon roman').updateGenre('Fantasy');

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
      createProject: vi.fn().mockResolvedValue(createMockProject()),
      loadProject: vi.fn().mockResolvedValue(createMockProject()),
      listProjects: vi.fn().mockResolvedValue([]),
      updateProject: vi.fn().mockResolvedValue(createMockProject()),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      updateChapter: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(0),
      findPublishedByToken: vi.fn().mockResolvedValue(null),
    };

    mockProjectSettingsRepository = {
      create: vi.fn().mockResolvedValue(createMockSettings()),
      findById: vi.fn().mockResolvedValue(null),
      findByProjectId: vi.fn().mockResolvedValue(createMockSettings()),
      update: vi.fn().mockResolvedValue(createMockSettings()),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };

    mockIdGenerator = {
      generate: vi.fn().mockReturnValue('generated-id-1'),
    };

    useCase = new CreateSnapshotUseCase(
      mockSnapshotRepository,
      mockProjectRepository,
      mockProjectSettingsRepository,
      mockIdGenerator
    );
  });

  const validInput = {
    ownerId,
    projectId,
    title: 'Version 1',
  };

  it('creates a snapshot capturing the full manuscript', async () => {
    const result = await useCase.execute(validInput);

    expect(result.snapshot).toBeInstanceOf(Snapshot);
    expect(result.snapshot.getId()).toBe('generated-id-1');
    expect(result.snapshot.getProjectId()).toBe(projectId);
    expect(result.snapshot.getOwnerId()).toBe(ownerId);
    expect(result.snapshot.getAuthorId()).toBe(ownerId);
    expect(result.snapshot.getType()).toBe('manual');
    expect(result.snapshot.getTitle()).toBe('Version 1');
    expect(result.snapshot.getProjectTitle()).toBe('Mon roman');
    expect(result.snapshot.getChapters()).toEqual([
      {
        id: chapterId,
        title: 'Chapitre 1',
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        order: 0,
      },
    ]);
  });

  it('captures editorial metadata from project settings', async () => {
    const result = await useCase.execute(validInput);

    expect(result.snapshot.getEditorialMetadata()).toMatchObject({
      genre: 'Fantasy',
    });
  });

  it('excludes personal preferences and automation settings from the captured metadata', async () => {
    const settingsWithExcludedFields = ProjectSettings.create(
      'settings-1',
      projectId,
      ownerId,
      'Mon roman'
    )
      .updateGenre('Fantasy')
      .updateAutocompletePreferences({ enabled: true, suggestionLength: 'long' })
      .updateCanonExtractionPreferences({ mode: 'session-end' })
      .updateCustomDictionary(['néologisme'])
      .updatePublicationProfile('a5')
      .updateTocPreferences({ depth: 'chapters-and-subtitles' })
      .updateEndnotesTitle('Annexes');
    vi.mocked(mockProjectSettingsRepository.findByProjectId).mockResolvedValue(
      settingsWithExcludedFields
    );

    const result = await useCase.execute(validInput);

    const metadata = result.snapshot.getEditorialMetadata();
    expect(metadata).not.toBeNull();
    expect(Object.keys(metadata!).sort()).toEqual(
      [
        'title',
        'subtitle',
        'summary',
        'coverImageUrl',
        'genre',
        'synopsis',
        'pointOfView',
        'tense',
        'targetAudience',
        'isbn',
        'contributors',
        'relatedWorks',
      ].sort()
    );
  });

  it('captures null editorial metadata when no settings exist yet', async () => {
    vi.mocked(mockProjectSettingsRepository.findByProjectId).mockResolvedValue(null);

    const result = await useCase.execute(validInput);

    expect(result.snapshot.getEditorialMetadata()).toBeNull();
  });

  it('allocates the sequence number from the repository', async () => {
    vi.mocked(mockSnapshotRepository.getNextSequenceNumber).mockResolvedValue(7);

    const result = await useCase.execute(validInput);

    expect(mockSnapshotRepository.getNextSequenceNumber).toHaveBeenCalledWith(ownerId, projectId);
    expect(result.snapshot.getNumber()).toBe(7);
  });

  it('saves the snapshot via the repository', async () => {
    await useCase.execute(validInput);

    expect(mockSnapshotRepository.save).toHaveBeenCalledTimes(1);
    expect(mockSnapshotRepository.save).toHaveBeenCalledWith(ownerId, expect.any(Snapshot));
  });

  it('accepts an optional comment', async () => {
    const result = await useCase.execute({ ...validInput, comment: 'Fin de partie 1' });

    expect(result.snapshot.getComment()).toBe('Fin de partie 1');
  });

  it('allows creating a snapshot with no changes since the last one (editorial milestone)', async () => {
    vi.mocked(mockSnapshotRepository.findLatestByProjectId).mockResolvedValue(
      new Snapshot({
        id: 'previous',
        projectId,
        ownerId,
        authorId: ownerId,
        number: 1,
        type: 'manual',
        title: 'Version 1',
        comment: null,
        projectTitle: 'Mon roman',
        chapters: [{ id: chapterId, title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 }],
        editorialMetadata: null,
      })
    );

    await expect(useCase.execute(validInput)).resolves.toBeDefined();
  });

  it('throws if ownerId is empty', async () => {
    await expect(useCase.execute({ ...validInput, ownerId: '' })).rejects.toThrow('Owner ID is required');
  });

  it('throws if projectId is empty', async () => {
    await expect(useCase.execute({ ...validInput, projectId: '' })).rejects.toThrow('Project ID is required');
  });

  it('throws if title is empty', async () => {
    await expect(useCase.execute({ ...validInput, title: '' })).rejects.toThrow('Snapshot title is required');
  });

  it('throws if project not found or not owned', async () => {
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow('Project not found');
  });

  it('does not save a snapshot when the project cannot be loaded', async () => {
    vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow();
    expect(mockSnapshotRepository.getNextSequenceNumber).not.toHaveBeenCalled();
    expect(mockSnapshotRepository.save).not.toHaveBeenCalled();
  });
});
