// ABOUTME: Integration tests for loading an immutable snapshot comparison from MongoDB.
// ABOUTME: Verifies the server-captured current state and rich snapshot content stay isolated.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ObjectId, type Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBSnapshotRepository } from '@/infrastructure/persistence/MongoDBSnapshotRepository';
import { MongoDBProjectRepository } from '@/infrastructure/persistence/MongoDBProjectRepository';
import { MongoDBProjectSettingsRepository } from '@/infrastructure/persistence/MongoDBProjectSettingsRepository';
import { Snapshot } from '@/domain/entities/Snapshot';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { LoadSnapshotComparisonUseCase } from '../LoadSnapshotComparisonUseCase';

describe('LoadSnapshotComparisonUseCase — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-comparison-${randomUUID()}`;
    projectId = `project-${randomUUID()}`;
  });

  afterEach(async () => {
    await Promise.all([
      db.collection('snapshots').deleteMany({ ownerId }),
      db.collection('snapshotCounters').deleteMany({ ownerId }),
      db.collection('projects').deleteMany({ ownerId }),
      db.collection('project_settings').deleteMany({ ownerId }),
    ]);
  });

  it('loads a past version against the timestamped persisted current state without mutating either', async () => {
    const snapshotRepository = new MongoDBSnapshotRepository(db);
    const projectRepository = new MongoDBProjectRepository(db);
    const settingsRepository = new MongoDBProjectSettingsRepository(db);
    const snapshotId = randomUUID();

    const pastContent = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Texte de la version passée.' }] },
        { type: 'horizontalRule' },
      ],
    });
    const currentContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texte courant enregistré.' }] }],
    });

    const project = new Project(
      projectId,
      ownerId,
      'Roman courant',
      [new Chapter('chapter-1', 'Chapitre renommé', currentContent, 0)],
      'chapter-1',
      null,
      new Date('2026-07-01T10:00:00.000Z'),
      new Date('2026-07-02T10:00:00.000Z'),
    );
    await projectRepository.createProject(ownerId, project);
    await settingsRepository.create(
      ownerId,
      ProjectSettings.reconstruct({
        id: new ObjectId().toHexString(), projectId, ownerId, title: 'Roman courant', subtitle: 'Sous-titre courant',
        summary: 'Résumé courant', genre: 'Fantasy', synopsis: 'Intrigue courante', contributors: [], relatedWorks: [],
        createdAt: new Date('2026-07-01T10:00:00.000Z'), updatedAt: new Date('2026-07-02T10:00:00.000Z'),
      }),
    );
    await snapshotRepository.save(ownerId, new Snapshot({
      id: snapshotId, projectId, ownerId, authorId: ownerId, number: 1, type: 'manual',
      title: 'Version 1', comment: null, projectTitle: 'Roman passé',
      chapters: [{ id: 'chapter-1', title: 'Chapitre originel', content: pastContent, order: 0 }],
      editorialMetadata: {
        title: 'Roman passé', summary: 'Résumé passé', genre: 'Historique', synopsis: 'Intrigue passée',
        contributors: [], relatedWorks: [],
      },
      createdAt: new Date('2026-07-01T12:00:00.000Z'),
    }));

    const result = await new LoadSnapshotComparisonUseCase(
      snapshotRepository, projectRepository, settingsRepository,
    ).execute({ ownerId, projectId, snapshotId });

    expect(result.snapshot.getChapters()[0]).toMatchObject({ title: 'Chapitre originel', content: pastContent });
    expect(result.current.chapters[0]).toMatchObject({ title: 'Chapitre renommé', content: currentContent });
    expect(result.current.editorialMetadata).toMatchObject({ title: 'Roman courant', genre: 'Fantasy' });
    expect(result.comparedAt).toBeInstanceOf(Date);
    expect((await projectRepository.loadProject(ownerId, projectId))?.getChapters()[0].getContent()).toBe(currentContent);
    expect((await snapshotRepository.findById(ownerId, snapshotId))?.getChapters()[0].content).toBe(pastContent);
  });
});
