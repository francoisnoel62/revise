// ABOUTME: Tests for project settings serializer
// ABOUTME: Verifies Document ↔ Entity conversion

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  serializeProjectSettings,
  deserializeProjectSettings,
  ProjectSettingsDocument,
} from '../project-settings-serializer';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { LevelStyleSet } from '@/domain/value-objects/LevelStyleSet';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

describe('project-settings-serializer', () => {
  const validObjectId = new ObjectId();

  const validProps = {
    id: validObjectId.toHexString(),
    projectId: 'project-456',
    ownerId: 'owner-789',
    title: 'My Novel',
    subtitle: 'A Subtitle',
    summary: 'A brief summary',
    coverImageUrl: 'https://example.com/cover.jpg',
    genre: 'Fantasy',
    synopsis: 'A longer synopsis',
    pointOfView: 'first_person' as const,
    tense: 'past' as const,
    targetAudience: 'adult' as const,
    isbn: '978-3-16-148410-0',
    contributors: [{ name: 'John Doe', role: 'author' as const }],
    relatedWorks: [{ title: 'Previous Book', projectId: 'proj-111' }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const validDocument: ProjectSettingsDocument = {
    _id: validObjectId,
    projectId: 'project-456',
    ownerId: 'owner-789',
    title: 'My Novel',
    subtitle: 'A Subtitle',
    summary: 'A brief summary',
    coverImageUrl: 'https://example.com/cover.jpg',
    genre: 'Fantasy',
    synopsis: 'A longer synopsis',
    pointOfView: 'first_person',
    tense: 'past',
    targetAudience: 'adult',
    isbn: '978-3-16-148410-0',
    contributors: [{ name: 'John Doe', role: 'author' }],
    relatedWorks: [{ title: 'Previous Book', projectId: 'proj-111' }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('serializeProjectSettings', () => {
    it('serializes entity to document', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const doc = serializeProjectSettings(settings);

      expect(doc._id.toHexString()).toBe(validObjectId.toHexString());
      expect(doc.projectId).toBe('project-456');
      expect(doc.ownerId).toBe('owner-789');
      expect(doc.title).toBe('My Novel');
      expect(doc.subtitle).toBe('A Subtitle');
      expect(doc.summary).toBe('A brief summary');
      expect(doc.coverImageUrl).toBe('https://example.com/cover.jpg');
      expect(doc.genre).toBe('Fantasy');
      expect(doc.synopsis).toBe('A longer synopsis');
      expect(doc.pointOfView).toBe('first_person');
      expect(doc.tense).toBe('past');
      expect(doc.targetAudience).toBe('adult');
      expect(doc.isbn).toBe('978-3-16-148410-0');
      expect(doc.contributors).toEqual([{ name: 'John Doe', role: 'author' }]);
      expect(doc.relatedWorks).toEqual([{ title: 'Previous Book', projectId: 'proj-111' }]);
      expect(doc.createdAt).toEqual(new Date('2024-01-01'));
      expect(doc.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('handles undefined optional fields', () => {
      const newObjectId = new ObjectId();
      const settings = ProjectSettings.create(newObjectId.toHexString(), 'proj-1', 'owner-1', 'Title');
      const doc = serializeProjectSettings(settings);

      expect(doc.subtitle).toBeUndefined();
      expect(doc.coverImageUrl).toBeUndefined();
      expect(doc.pointOfView).toBeUndefined();
      expect(doc.tense).toBeUndefined();
      expect(doc.targetAudience).toBeUndefined();
      expect(doc.isbn).toBeUndefined();
      expect(doc.contributors).toEqual([]);
      expect(doc.relatedWorks).toEqual([]);
    });
  });

  describe('deserializeProjectSettings', () => {
    it('deserializes document to entity', () => {
      const settings = deserializeProjectSettings(validDocument);

      expect(settings.getId()).toBe(validObjectId.toHexString());
      expect(settings.getProjectId()).toBe('project-456');
      expect(settings.getOwnerId()).toBe('owner-789');
      expect(settings.getTitle()).toBe('My Novel');
      expect(settings.getSubtitle()).toBe('A Subtitle');
      expect(settings.getSummary()).toBe('A brief summary');
      expect(settings.getCoverImageUrl()).toBe('https://example.com/cover.jpg');
      expect(settings.getGenre()).toBe('Fantasy');
      expect(settings.getSynopsis()).toBe('A longer synopsis');
      expect(settings.getPointOfView()).toBe('first_person');
      expect(settings.getTense()).toBe('past');
      expect(settings.getTargetAudience()).toBe('adult');
      expect(settings.getIsbn()).toBe('978-3-16-148410-0');
      expect(settings.getContributors()).toEqual([{ name: 'John Doe', role: 'author' }]);
      expect(settings.getRelatedWorks()).toEqual([{ title: 'Previous Book', projectId: 'proj-111' }]);
      expect(settings.getCreatedAt()).toEqual(new Date('2024-01-01'));
      expect(settings.getUpdatedAt()).toEqual(new Date('2024-01-02'));
    });

    it('handles undefined optional fields in document', () => {
      const doc: ProjectSettingsDocument = {
        _id: validObjectId,
        projectId: 'proj-1',
        ownerId: 'owner-1',
        title: 'Title',
        subtitle: undefined,
        summary: '',
        coverImageUrl: undefined,
        genre: '',
        synopsis: '',
        pointOfView: undefined,
        tense: undefined,
        targetAudience: undefined,
        isbn: undefined,
        contributors: [],
        relatedWorks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const settings = deserializeProjectSettings(doc);

      expect(settings.getSubtitle()).toBeUndefined();
      expect(settings.getCoverImageUrl()).toBeUndefined();
      expect(settings.getPointOfView()).toBeUndefined();
      expect(settings.getTense()).toBeUndefined();
      expect(settings.getTargetAudience()).toBeUndefined();
      expect(settings.getIsbn()).toBeUndefined();
    });
  });

  describe('round-trip serialization', () => {
    it('preserves sparse level typography independently for each PDF profile', () => {
      const kdpDefaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
      const a5Defaults = LevelStyleSet.defaultsFor(PublicationProfile.a5()).values;
      const original = ProjectSettings.reconstruct(validProps)
        .updateLevelStyleSet('kdp-6x9', {
          ...kdpDefaults,
          'titre-de-chapitre': {
            ...kdpDefaults['titre-de-chapitre'],
            fontSizePoints: 22,
          },
        })
        .updateLevelStyleSet('a5', {
          ...a5Defaults,
          corps: { ...a5Defaults.corps, lineHeight: 1.4 },
        });

      const restored = deserializeProjectSettings(serializeProjectSettings(original));

      expect(restored.getLevelStyleSet('kdp-6x9')?.values['titre-de-chapitre'].fontSizePoints).toBe(22);
      expect(restored.getLevelStyleSet('a5')?.values.corps.lineHeight).toBe(1.4);
    });

    it('tolerates legacy documents without level typography', () => {
      const restored = deserializeProjectSettings(validDocument);

      expect(restored.getLevelStylesByProfile()).toEqual({});
    });

    it('restores the persisted publication profile', () => {
      const original = ProjectSettings.reconstruct({
        ...validProps,
        publicationProfileId: 'passerelle',
      });

      const restored = deserializeProjectSettings(serializeProjectSettings(original));

      expect(restored.getPublicationProfileId()).toBe('passerelle');
    });

    it('preserves data through serialize then deserialize', () => {
      const original = ProjectSettings.reconstruct(validProps);
      const doc = serializeProjectSettings(original);
      const restored = deserializeProjectSettings(doc);

      expect(restored.toProperties()).toEqual(original.toProperties());
    });
  });
});
