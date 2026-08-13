// ABOUTME: Integration tests for the spell-check Server Actions against a real MongoDB.
// ABOUTME: Covers the dictionary and ignored-word writes, owner isolation, and the missing-settings no-op.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';

const COLLECTION = 'project_settings';

// The only thing these tests fake is who is signed in. Everything below the action —
// repository, serialization, MongoDB — is the real thing, because the defects this suite
// exists to catch (silent no-ops, writes that never land, owner leaks) all live there.
let signedInUserId: string;

vi.mock('@/infrastructure/config/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/infrastructure/config/providers')>();
  return {
    ...actual,
    getAuthProvider: () => ({
      getUserId: async () => signedInUserId,
      getSession: async () => null,
    }),
  };
});

const { getDatabase } = await import('@/infrastructure/config/database');
const { ProjectSettings } = await import('@/domain/entities/ProjectSettings');
const { getProjectSettingsRepository } = await import('@/infrastructure/config/providers');
const {
  getCustomDictionaryAction,
  addWordToCustomDictionaryAction,
  removeWordFromCustomDictionaryAction,
  getIgnoredWordsAction,
  addIgnoredWordAction,
  removeIgnoredWordAction,
  clearIgnoredWordsAction,
} = await import('../spell-check-actions');

describe('Actions du correcteur orthographique — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;

  async function seedSettings(forOwnerId = ownerId, forProjectId = projectId) {
    const repository = await getProjectSettingsRepository();
    const settings = ProjectSettings.create(
      new ObjectId().toHexString(),
      forProjectId,
      forOwnerId,
      'Roman de test'
    );
    await repository.create(forOwnerId, settings);
  }

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    projectId = `project-${randomUUID()}`;
    signedInUserId = ownerId;
  });

  afterEach(async () => {
    await db.collection(COLLECTION).deleteMany({ ownerId });
  });

  describe('dictionnaire personnel', () => {
    it('persiste un mot ajouté depuis la palette', async () => {
      await seedSettings();

      await addWordToCustomDictionaryAction(projectId, 'Vaucresson');

      expect(await getCustomDictionaryAction(projectId)).toContain('Vaucresson');
      // Relire par l'action prouve que l'aller-retour se tient ; relire la collection prouve
      // que l'écriture a bien atteint la base, ce que deux actions symétriques pourraient
      // masquer à elles seules.
      const stored = await db.collection(COLLECTION).findOne({ ownerId, projectId });
      expect(JSON.stringify(stored?.customDictionary)).toContain('Vaucresson');
    });

    it('retire un mot et sa déclaration', async () => {
      await seedSettings();
      await addWordToCustomDictionaryAction(projectId, 'Vaucresson');

      await removeWordFromCustomDictionaryAction(projectId, 'Vaucresson');

      expect(await getCustomDictionaryAction(projectId)).not.toContain('Vaucresson');
    });

    it('n’écrit rien et ne lève rien quand les réglages du projet n’existent pas encore', async () => {
      await addWordToCustomDictionaryAction(projectId, 'Vaucresson');

      expect(await db.collection(COLLECTION).countDocuments({ ownerId })).toBe(0);
      expect(await getCustomDictionaryAction(projectId)).toEqual([]);
    });
  });

  describe('mots ignorés', () => {
    it('persiste un mot ignoré', async () => {
      await seedSettings();

      await addIgnoredWordAction(projectId, 'Hiroshima');

      expect(await getIgnoredWordsAction(projectId)).toContain('Hiroshima');
    });

    it('retire un mot ignoré', async () => {
      await seedSettings();
      await addIgnoredWordAction(projectId, 'Hiroshima');

      await removeIgnoredWordAction(projectId, 'Hiroshima');

      expect(await getIgnoredWordsAction(projectId)).not.toContain('Hiroshima');
    });

    it('vide la liste des mots ignorés', async () => {
      await seedSettings();
      await addIgnoredWordAction(projectId, 'Hiroshima');
      await addIgnoredWordAction(projectId, 'Vaucresson');

      await clearIgnoredWordsAction(projectId);

      expect(await getIgnoredWordsAction(projectId)).toEqual([]);
    });

    it('n’écrit rien quand les réglages du projet n’existent pas encore', async () => {
      await addIgnoredWordAction(projectId, 'Hiroshima');

      expect(await db.collection(COLLECTION).countDocuments({ ownerId })).toBe(0);
    });
  });

  describe('isolation entre auteurs', () => {
    it('ne lit pas le dictionnaire d’un autre auteur', async () => {
      await seedSettings();
      await addWordToCustomDictionaryAction(projectId, 'Vaucresson');

      signedInUserId = `test-integration-${randomUUID()}`;

      expect(await getCustomDictionaryAction(projectId)).toEqual([]);
    });

    it('n’écrit pas dans les réglages d’un autre auteur', async () => {
      await seedSettings();
      const intruderId = `test-integration-${randomUUID()}`;
      signedInUserId = intruderId;

      await addIgnoredWordAction(projectId, 'Hiroshima');

      signedInUserId = ownerId;
      expect(await getIgnoredWordsAction(projectId)).toEqual([]);
    });
  });
});
