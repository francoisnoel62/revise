// ABOUTME: Integration tests for RestoreSnapshotUseCase against a real MongoDB, no mocks
// ABOUTME: Validates direct restore, the safety-snapshot path, concurrency conflicts, and provenance end-to-end

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBProjectRepository } from '@/infrastructure/persistence/MongoDBProjectRepository';
import { MongoDBSnapshotRepository } from '@/infrastructure/persistence/MongoDBSnapshotRepository';
import { MongoDBProjectSettingsRepository } from '@/infrastructure/persistence/MongoDBProjectSettingsRepository';
import { objectIdGenerator } from '@/infrastructure/utils/ObjectIdGenerator';
import {
  RestoreSnapshotUseCase,
  ConcurrentModificationError,
} from '../RestoreSnapshotUseCase';
import { CreateSnapshotUseCase } from '../CreateSnapshotUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';

const PROJECTS_COLLECTION = 'projects';
const SNAPSHOTS_COLLECTION = 'snapshots';
const COUNTERS_COLLECTION = 'snapshotCounters';
const SETTINGS_COLLECTION = 'project_settings';

function chapterContent(text: string): string {
  return JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
}

describe('RestoreSnapshotUseCase — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;
  let chapterId: string;
  let projectRepository: MongoDBProjectRepository;
  let snapshotRepository: MongoDBSnapshotRepository;
  let settingsRepository: MongoDBProjectSettingsRepository;
  let useCase: RestoreSnapshotUseCase;
  let createSnapshotUseCase: CreateSnapshotUseCase;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    projectId = `project-${randomUUID()}`;
    chapterId = `chapter-${randomUUID()}`;

    projectRepository = new MongoDBProjectRepository(db);
    snapshotRepository = new MongoDBSnapshotRepository(db);
    settingsRepository = new MongoDBProjectSettingsRepository(db);
    await snapshotRepository.ensureIndexes();
    await settingsRepository.ensureIndexes();

    useCase = new RestoreSnapshotUseCase(
      snapshotRepository,
      projectRepository,
      settingsRepository,
      objectIdGenerator
    );
    createSnapshotUseCase = new CreateSnapshotUseCase(
      snapshotRepository,
      projectRepository,
      settingsRepository,
      objectIdGenerator
    );
  });

  afterEach(async () => {
    await db.collection(PROJECTS_COLLECTION).deleteMany({ ownerId });
    await db.collection(SNAPSHOTS_COLLECTION).deleteMany({ ownerId });
    await db.collection(COUNTERS_COLLECTION).deleteMany({ ownerId });
    await db.collection(SETTINGS_COLLECTION).deleteMany({ ownerId });
  });

  async function seedProject(): Promise<Project> {
    const chapter = new Chapter(chapterId, 'Chapitre original', chapterContent('Texte original.'), 0);
    const now = new Date();
    const project = new Project(projectId, ownerId, 'Roman de test', [chapter], chapterId, null, now, now);
    return projectRepository.createProject(ownerId, project);
  }

  async function seedSettings(genre: string): Promise<void> {
    const settings = ProjectSettings.create(objectIdGenerator.generate(), projectId, ownerId, 'Roman de test').updateGenre(
      genre
    );
    await settingsRepository.create(ownerId, settings);
  }

  it('restores directly when the current state already matches the latest snapshot', async () => {
    const project = await seedProject();
    await seedSettings('Fantasy');
    const { snapshot: v1 } = await createSnapshotUseCase.execute({
      ownerId,
      projectId,
      title: 'Version 1',
    });

    const result = await useCase.execute({
      ownerId,
      projectId,
      snapshotId: v1.getId(),
      expectedProjectUpdatedAt: project.getUpdatedAt(),
    });

    expect(result.safetySnapshot).toBeNull();
    expect(result.restoreSnapshot.getType()).toBe('restore');
    expect(result.restoreSnapshot.getSourceSnapshotNumber()).toBe(1);
    expect(result.restoreSnapshot.getNumber()).toBe(2);

    const reloaded = await projectRepository.loadProject(ownerId, projectId);
    expect(reloaded!.getChapters()[0].getContent()).toBe(chapterContent('Texte original.'));

    const allSnapshots = await snapshotRepository.findByProjectId(ownerId, projectId);
    expect(allSnapshots).toHaveLength(2); // v1 (manual) + v2 (restore), no safety
  });

  it('creates a safety snapshot before restoring when the current state has diverged', async () => {
    const project = await seedProject();
    await seedSettings('Fantasy');
    const { snapshot: v1 } = await createSnapshotUseCase.execute({
      ownerId,
      projectId,
      title: 'Version 1',
    });

    // Diverge: edit the chapter directly, after the snapshot was taken.
    const divergedChapter = new Chapter(chapterId, 'Chapitre modifié', chapterContent('Texte modifié.'), 0);
    await projectRepository.updateChapter(ownerId, projectId, divergedChapter);
    const divergedProject = await projectRepository.loadProject(ownerId, projectId);

    const result = await useCase.execute({
      ownerId,
      projectId,
      snapshotId: v1.getId(),
      expectedProjectUpdatedAt: divergedProject!.getUpdatedAt(),
    });

    expect(result.safetySnapshot).not.toBeNull();
    expect(result.safetySnapshot!.getType()).toBe('safety');
    expect(result.safetySnapshot!.getNumber()).toBe(2);
    expect(result.safetySnapshot!.getChapters()[0].content).toBe(chapterContent('Texte modifié.'));
    expect(result.restoreSnapshot.getNumber()).toBe(3);

    const reloaded = await projectRepository.loadProject(ownerId, projectId);
    expect(reloaded!.getChapters()[0].getContent()).toBe(chapterContent('Texte original.'));
    expect(reloaded!.getChapters()[0].getTitle()).toBe('Chapitre original');

    const allSnapshots = await snapshotRepository.findByProjectId(ownerId, projectId);
    expect(allSnapshots).toHaveLength(3); // v1 manual, v2 safety, v3 restore
    expect(project.getId()).toBe(projectId);
  });

  it('restores editorial metadata onto project settings and preserves provenance', async () => {
    await seedProject();
    await seedSettings('Fantasy');
    const { snapshot: v1 } = await createSnapshotUseCase.execute({
      ownerId,
      projectId,
      title: 'Version 1',
    });

    const currentSettings = await settingsRepository.findByProjectId(ownerId, projectId);
    const changedSettings = currentSettings!.updateGenre('Romance');
    await settingsRepository.update(ownerId, changedSettings);
    const projectBeforeRestore = await projectRepository.loadProject(ownerId, projectId);

    await useCase.execute({
      ownerId,
      projectId,
      snapshotId: v1.getId(),
      expectedProjectUpdatedAt: projectBeforeRestore!.getUpdatedAt(),
    });

    const restoredSettings = await settingsRepository.findByProjectId(ownerId, projectId);
    expect(restoredSettings!.getGenre()).toBe('Fantasy');

    const persistedRestoreSnapshot = await snapshotRepository.findById(
      ownerId,
      (await snapshotRepository.findLatestByProjectId(ownerId, projectId))!.getId()
    );
    expect(persistedRestoreSnapshot!.getType()).toBe('restore');
    expect(persistedRestoreSnapshot!.getSourceSnapshotNumber()).toBe(1);
  });

  it('rejects with ConcurrentModificationError and leaves the project untouched on a stale expectedProjectUpdatedAt', async () => {
    await seedProject();
    const { snapshot: v1 } = await createSnapshotUseCase.execute({
      ownerId,
      projectId,
      title: 'Version 1',
    });

    await expect(
      useCase.execute({
        ownerId,
        projectId,
        snapshotId: v1.getId(),
        expectedProjectUpdatedAt: new Date('2000-01-01T00:00:00.000Z'),
      })
    ).rejects.toThrow(ConcurrentModificationError);

    const reloaded = await projectRepository.loadProject(ownerId, projectId);
    expect(reloaded!.getChapters()[0].getContent()).toBe(chapterContent('Texte original.'));

    const allSnapshots = await snapshotRepository.findByProjectId(ownerId, projectId);
    expect(allSnapshots).toHaveLength(1); // only v1 — the conflict allocated no number, saved nothing
  });

  it('preserves publication state across the restore', async () => {
    const project = await seedProject();
    project.publish();
    await projectRepository.updateProject(ownerId, project);
    const publishedProject = await projectRepository.loadProject(ownerId, projectId);

    const { snapshot: v1 } = await createSnapshotUseCase.execute({
      ownerId,
      projectId,
      title: 'Version 1',
    });

    await useCase.execute({
      ownerId,
      projectId,
      snapshotId: v1.getId(),
      expectedProjectUpdatedAt: publishedProject!.getUpdatedAt(),
    });

    const reloaded = await projectRepository.loadProject(ownerId, projectId);
    expect(reloaded!.getIsPublished()).toBe(true);
    expect(reloaded!.getShareToken()).toBe(publishedProject!.getShareToken());
  });
});
