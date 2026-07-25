// ABOUTME: Unit tests for RestoreSnapshotUseCase
// ABOUTME: Validates direct restore, the safety-snapshot path, concurrency conflicts, atomicity, and provenance

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RestoreSnapshotUseCase,
  ProjectNotFoundError,
  SnapshotNotFoundError,
  ConcurrentModificationError,
} from '../RestoreSnapshotUseCase';
import { Snapshot } from '../../../domain/entities/Snapshot';
import { SnapshotRepository } from '../../../domain/interfaces/SnapshotRepository';
import { ProjectRepository } from '../../../domain/interfaces/ProjectRepository';
import { ProjectSettingsRepository } from '../../../domain/interfaces/ProjectSettingsRepository';
import { IdGenerator } from '../../../domain/interfaces/IdGenerator';
import { Project } from '../../../domain/entities/Project';
import { Chapter } from '../../../domain/entities/Chapter';
import { ProjectSettings } from '../../../domain/entities/ProjectSettings';

describe('RestoreSnapshotUseCase', () => {
  let useCase: RestoreSnapshotUseCase;
  let mockSnapshotRepository: SnapshotRepository;
  let mockProjectRepository: ProjectRepository;
  let mockProjectSettingsRepository: ProjectSettingsRepository;
  let mockIdGenerator: IdGenerator;

  const ownerId = 'user-1';
  const projectId = 'project-1';
  const currentChapterId = 'chapter-current';
  const sourceChapterId = 'chapter-source';
  const snapshotId = 'snapshot-4';
  const projectCreatedAt = new Date('2026-01-01T00:00:00.000Z');
  const projectUpdatedAt = new Date('2026-01-05T00:00:00.000Z');

  const createCurrentProject = (): Project => {
    const chapter = new Chapter(
      currentChapterId,
      'Chapitre courant',
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      0
    );
    return new Project(
      projectId,
      ownerId,
      'Titre courant',
      [chapter],
      currentChapterId,
      null,
      projectCreatedAt,
      projectUpdatedAt
    );
  };

  const createSourceSnapshot = (overrides: Partial<ConstructorParameters<typeof Snapshot>[0]> = {}): Snapshot =>
    new Snapshot({
      id: snapshotId,
      projectId,
      ownerId,
      authorId: ownerId,
      number: 4,
      type: 'manual',
      title: 'Version 4',
      comment: null,
      projectTitle: 'Titre restauré',
      chapters: [
        { id: sourceChapterId, title: 'Chapitre restauré', content: '{"type":"doc","content":[]}', order: 0 },
      ],
      editorialMetadata: {
        title: 'Titre restauré',
        summary: 'Résumé restauré',
        genre: 'Fantasy',
        synopsis: 'Synopsis restauré',
        contributors: [],
        relatedWorks: [],
      },
      ...overrides,
    });

  const createCurrentSettings = (): ProjectSettings =>
    ProjectSettings.reconstruct({
      id: 'settings-1',
      projectId,
      ownerId,
      title: 'Titre courant',
      summary: '',
      genre: 'Romance',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: projectCreatedAt,
      updatedAt: projectUpdatedAt,
    });

  let idCounter = 0;

  beforeEach(() => {
    idCounter = 0;

    mockSnapshotRepository = {
      getNextSequenceNumber: vi.fn().mockResolvedValue(5),
      save: vi.fn().mockResolvedValue(undefined),
      findByProjectId: vi.fn().mockResolvedValue([]),
      findLatestByProjectId: vi.fn().mockResolvedValue(createSourceSnapshot()),
      findById: vi.fn().mockResolvedValue(createSourceSnapshot()),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(0),
    };

    mockProjectRepository = {
      createProject: vi.fn().mockResolvedValue(createCurrentProject()),
      loadProject: vi.fn().mockResolvedValue(createCurrentProject()),
      listProjects: vi.fn().mockResolvedValue([]),
      updateProject: vi.fn().mockResolvedValue(createCurrentProject()),
      replaceProjectIfUnchanged: vi.fn().mockResolvedValue(true),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      updateChapter: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(0),
      findPublishedByToken: vi.fn().mockResolvedValue(null),
    };

    mockProjectSettingsRepository = {
      create: vi.fn().mockResolvedValue(createCurrentSettings()),
      findById: vi.fn().mockResolvedValue(null),
      findByProjectId: vi.fn().mockResolvedValue(createCurrentSettings()),
      update: vi.fn().mockResolvedValue(createCurrentSettings()),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };

    mockIdGenerator = {
      generate: vi.fn().mockImplementation(() => `generated-id-${++idCounter}`),
    };

    useCase = new RestoreSnapshotUseCase(
      mockSnapshotRepository,
      mockProjectRepository,
      mockProjectSettingsRepository,
      mockIdGenerator
    );
  });

  const validInput = {
    ownerId,
    projectId,
    snapshotId,
    expectedProjectUpdatedAt: projectUpdatedAt,
  };

  describe('direct restore (no unsnapshotted changes)', () => {
    beforeEach(() => {
      // Latest snapshot is at least as recent as project/settings -> no safety snapshot needed.
      vi.mocked(mockSnapshotRepository.findLatestByProjectId).mockResolvedValue(
        createSourceSnapshot({ number: 10, createdAt: new Date('2026-02-01T00:00:00.000Z') })
      );
    });

    it('replaces the project chapters/title with the source snapshot content', async () => {
      const result = await useCase.execute(validInput);

      expect(result.project.getTitle()).toBe('Titre restauré');
      expect(result.project.getChapters()).toHaveLength(1);
      expect(result.project.getChapters()[0].getId()).toBe(sourceChapterId);
      expect(result.project.getChapters()[0].getTitle()).toBe('Chapitre restauré');
    });

    it('does not create a safety snapshot', async () => {
      const result = await useCase.execute(validInput);

      expect(result.safetySnapshot).toBeNull();
      expect(mockSnapshotRepository.save).toHaveBeenCalledTimes(1);
    });

    it('creates a restore snapshot referencing the source snapshot number', async () => {
      const result = await useCase.execute(validInput);

      expect(result.restoreSnapshot.getType()).toBe('restore');
      expect(result.restoreSnapshot.getSourceSnapshotNumber()).toBe(4);
    });

    it('persists the restored project via the atomic compare-and-swap', async () => {
      await useCase.execute(validInput);

      expect(mockProjectRepository.replaceProjectIfUnchanged).toHaveBeenCalledWith(
        ownerId,
        expect.any(Project),
        projectUpdatedAt
      );
    });

    it('restores editorial metadata onto project settings', async () => {
      await useCase.execute(validInput);

      expect(mockProjectSettingsRepository.update).toHaveBeenCalledTimes(1);
      const updatedSettings = vi.mocked(mockProjectSettingsRepository.update).mock.calls[0][1];
      expect(updatedSettings.getGenre()).toBe('Fantasy');
      expect(updatedSettings.getSummary()).toBe('Résumé restauré');
    });

    it('creates project settings when none existed yet', async () => {
      vi.mocked(mockProjectSettingsRepository.findByProjectId).mockResolvedValue(null);

      await useCase.execute(validInput);

      expect(mockProjectSettingsRepository.create).toHaveBeenCalledTimes(1);
      expect(mockProjectSettingsRepository.update).not.toHaveBeenCalled();
    });

    it('leaves settings untouched when the source snapshot captured no editorial metadata', async () => {
      vi.mocked(mockSnapshotRepository.findById).mockResolvedValue(
        createSourceSnapshot({ editorialMetadata: null })
      );

      await useCase.execute(validInput);

      expect(mockProjectSettingsRepository.update).not.toHaveBeenCalled();
      expect(mockProjectSettingsRepository.create).not.toHaveBeenCalled();
    });

    it('preserves publication state on the restored project', async () => {
      vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(
        new Project(
          projectId,
          ownerId,
          'Titre courant',
          [new Chapter(currentChapterId, 'Chapitre courant', '{"type":"doc","content":[]}', 0)],
          currentChapterId,
          null,
          projectCreatedAt,
          projectUpdatedAt,
          true,
          'share-token-123',
          new Date('2026-01-03T00:00:00.000Z'),
          ['some-published-chapter-id']
        )
      );

      const result = await useCase.execute(validInput);

      expect(result.project.getIsPublished()).toBe(true);
      expect(result.project.getShareToken()).toBe('share-token-123');
      expect(result.project.getPublishedChapterIds()).toEqual(['some-published-chapter-id']);
    });

    it.each(['manual', 'automatic', 'restore', 'safety'] as const)(
      'restores a snapshot regardless of its own type (source type: %s)',
      async (sourceType) => {
        const overrides =
          sourceType === 'restore' ? { type: sourceType, sourceSnapshotNumber: 1 } : { type: sourceType };
        vi.mocked(mockSnapshotRepository.findById).mockResolvedValue(
          createSourceSnapshot(overrides)
        );

        const result = await useCase.execute(validInput);

        expect(result.project.getTitle()).toBe('Titre restauré');
        expect(result.restoreSnapshot.getType()).toBe('restore');
      }
    );
  });

  describe('safety-snapshot path (current state differs from the latest snapshot)', () => {
    beforeEach(() => {
      vi.mocked(mockSnapshotRepository.findLatestByProjectId).mockResolvedValue(
        createSourceSnapshot({ number: 3, createdAt: new Date('2025-12-01T00:00:00.000Z') })
      );
      vi.mocked(mockSnapshotRepository.getNextSequenceNumber)
        .mockResolvedValueOnce(11)
        .mockResolvedValueOnce(12);
    });

    it('creates a safety snapshot capturing the current (pre-restore) state before restoring', async () => {
      const result = await useCase.execute(validInput);

      expect(result.safetySnapshot).not.toBeNull();
      expect(result.safetySnapshot!.getType()).toBe('safety');
      expect(result.safetySnapshot!.getNumber()).toBe(11);
      expect(result.safetySnapshot!.getProjectTitle()).toBe('Titre courant');
      expect(result.safetySnapshot!.getChapters()[0].id).toBe(currentChapterId);
    });

    it('allocates the restore snapshot number after the safety snapshot number', async () => {
      const result = await useCase.execute(validInput);

      expect(result.restoreSnapshot.getNumber()).toBe(12);
    });

    it('saves both the safety snapshot and the restore snapshot', async () => {
      await useCase.execute(validInput);

      expect(mockSnapshotRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('concurrency conflict', () => {
    it('throws ConcurrentModificationError when expectedProjectUpdatedAt does not match the project', async () => {
      await expect(
        useCase.execute({ ...validInput, expectedProjectUpdatedAt: new Date('2020-01-01T00:00:00.000Z') })
      ).rejects.toThrow(ConcurrentModificationError);
    });

    it('does not allocate any snapshot number when the pre-check fails', async () => {
      await expect(
        useCase.execute({ ...validInput, expectedProjectUpdatedAt: new Date('2020-01-01T00:00:00.000Z') })
      ).rejects.toThrow();

      expect(mockSnapshotRepository.getNextSequenceNumber).not.toHaveBeenCalled();
      expect(mockSnapshotRepository.save).not.toHaveBeenCalled();
      expect(mockProjectRepository.replaceProjectIfUnchanged).not.toHaveBeenCalled();
    });

    it('throws ConcurrentModificationError when the atomic compare-and-swap loses the race', async () => {
      vi.mocked(mockProjectRepository.replaceProjectIfUnchanged).mockResolvedValue(false);

      await expect(useCase.execute(validInput)).rejects.toThrow(ConcurrentModificationError);
    });

    it('does not allocate any snapshot number when the compare-and-swap loses the race', async () => {
      vi.mocked(mockProjectRepository.replaceProjectIfUnchanged).mockResolvedValue(false);

      await expect(useCase.execute(validInput)).rejects.toThrow();

      expect(mockSnapshotRepository.getNextSequenceNumber).not.toHaveBeenCalled();
      expect(mockSnapshotRepository.save).not.toHaveBeenCalled();
    });

    it('does not touch project settings when the compare-and-swap loses the race', async () => {
      vi.mocked(mockProjectRepository.replaceProjectIfUnchanged).mockResolvedValue(false);

      await expect(useCase.execute(validInput)).rejects.toThrow();

      expect(mockProjectSettingsRepository.update).not.toHaveBeenCalled();
      expect(mockProjectSettingsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('atomicity — post-CAS failure compensation', () => {
    it('reverts the project back to its pre-restore state when persisting settings fails', async () => {
      vi.mocked(mockProjectSettingsRepository.update).mockRejectedValue(new Error('DB write failed'));

      await expect(useCase.execute(validInput)).rejects.toThrow('DB write failed');

      expect(mockProjectRepository.replaceProjectIfUnchanged).toHaveBeenCalledTimes(2);
      const [, revertedProject] = vi.mocked(mockProjectRepository.replaceProjectIfUnchanged).mock.calls[1];
      expect(revertedProject.getTitle()).toBe('Titre courant');
    });

    it('reverts the project back to its pre-restore state when saving the restore snapshot fails', async () => {
      vi.mocked(mockSnapshotRepository.save).mockRejectedValue(new Error('DB write failed'));

      await expect(useCase.execute(validInput)).rejects.toThrow('DB write failed');

      expect(mockProjectRepository.replaceProjectIfUnchanged).toHaveBeenCalledTimes(2);
      const [, revertedProject] = vi.mocked(mockProjectRepository.replaceProjectIfUnchanged).mock.calls[1];
      expect(revertedProject.getTitle()).toBe('Titre courant');
    });

    it('still throws the original error even if the compensating revert itself fails', async () => {
      vi.mocked(mockSnapshotRepository.save).mockRejectedValue(new Error('DB write failed'));
      vi.mocked(mockProjectRepository.replaceProjectIfUnchanged)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Revert also failed'));

      await expect(useCase.execute(validInput)).rejects.toThrow('DB write failed');
    });
  });

  describe('validation', () => {
    it('throws if ownerId is empty', async () => {
      await expect(useCase.execute({ ...validInput, ownerId: '' })).rejects.toThrow('Owner ID is required');
    });

    it('throws if projectId is empty', async () => {
      await expect(useCase.execute({ ...validInput, projectId: '' })).rejects.toThrow('Project ID is required');
    });

    it('throws if snapshotId is empty', async () => {
      await expect(useCase.execute({ ...validInput, snapshotId: '' })).rejects.toThrow('Snapshot ID is required');
    });

    it('throws ProjectNotFoundError if the project cannot be loaded', async () => {
      vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(null);

      await expect(useCase.execute(validInput)).rejects.toThrow(ProjectNotFoundError);
    });

    it('throws SnapshotNotFoundError if the source snapshot does not exist', async () => {
      vi.mocked(mockSnapshotRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute(validInput)).rejects.toThrow(SnapshotNotFoundError);
    });

    it('throws SnapshotNotFoundError if the source snapshot belongs to a different project', async () => {
      vi.mocked(mockSnapshotRepository.findById).mockResolvedValue(
        createSourceSnapshot({ projectId: 'another-project' })
      );

      await expect(useCase.execute(validInput)).rejects.toThrow(SnapshotNotFoundError);
    });
  });
});
