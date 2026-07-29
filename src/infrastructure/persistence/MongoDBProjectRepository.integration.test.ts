// ABOUTME: Integration tests for MongoDBProjectRepository against a real MongoDB
// ABOUTME: Verifies replaceProjectIfUnchanged's atomic compare-and-swap — no mocks

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBProjectRepository } from './MongoDBProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

const COLLECTION = 'projects';

describe('MongoDBProjectRepository — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let repository: MongoDBProjectRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    repository = new MongoDBProjectRepository(db);
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ ownerId });
  });

  describe('replaceProjectIfUnchanged', () => {
    it('replaces the project when expectedUpdatedAt matches the stored value', async () => {
      const chapter = new Chapter(randomUUID(), 'Chapitre 1', '{"type":"doc","content":[]}', 0);
      const project = Project.create(ownerId, 'Roman de test', [chapter]);
      await repository.createProject(ownerId, project);
      const expectedUpdatedAt = project.getUpdatedAt();

      project.updateTitle('Titre restauré');
      const succeeded = await repository.replaceProjectIfUnchanged(
        ownerId,
        project,
        expectedUpdatedAt
      );

      expect(succeeded).toBe(true);
      const loaded = await repository.loadProject(ownerId, project.getId());
      expect(loaded?.getTitle()).toBe('Titre restauré');
    });

    it('rejects the replace when the project changed concurrently', async () => {
      const chapter = new Chapter(randomUUID(), 'Chapitre 1', '{"type":"doc","content":[]}', 0);
      const project = Project.create(ownerId, 'Roman de test', [chapter]);
      await repository.createProject(ownerId, project);
      const staleUpdatedAt = project.getUpdatedAt();

      await new Promise((r) => setTimeout(r, 10));
      project.updateTitle('Modifié concurremment');
      await repository.updateProject(ownerId, project);

      const restoreAttempt = new Project(
        project.getId(),
        ownerId,
        'Titre restauré',
        [chapter],
        chapter.getId(),
        null,
        project.getCreatedAt(),
        new Date()
      );
      const succeeded = await repository.replaceProjectIfUnchanged(
        ownerId,
        restoreAttempt,
        staleUpdatedAt
      );

      expect(succeeded).toBe(false);
      const loaded = await repository.loadProject(ownerId, project.getId());
      expect(loaded?.getTitle()).toBe('Modifié concurremment');
    });

    it('returns false when the project does not exist', async () => {
      const chapter = new Chapter(randomUUID(), 'Chapitre 1', '{"type":"doc","content":[]}', 0);
      const project = Project.create(ownerId, 'Roman de test', [chapter]);

      const succeeded = await repository.replaceProjectIfUnchanged(
        ownerId,
        project,
        project.getUpdatedAt()
      );

      expect(succeeded).toBe(false);
    });

    it('returns false when the user does not own the project', async () => {
      const chapter = new Chapter(randomUUID(), 'Chapitre 1', '{"type":"doc","content":[]}', 0);
      const project = Project.create(ownerId, 'Roman de test', [chapter]);
      await repository.createProject(ownerId, project);

      const succeeded = await repository.replaceProjectIfUnchanged(
        'a-different-owner',
        project,
        project.getUpdatedAt()
      );

      expect(succeeded).toBe(false);
    });
  });
});
