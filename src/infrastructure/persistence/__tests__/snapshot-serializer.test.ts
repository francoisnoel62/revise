// ABOUTME: Tests for the Snapshot serializer
// ABOUTME: Verifies Document <-> Entity round trip, including nullable editorial metadata

import { describe, it, expect } from 'vitest';
import {
  serializeSnapshot,
  deserializeSnapshot,
  SnapshotDocument,
} from '../snapshot-serializer';
import { Snapshot, SnapshotChapter, SnapshotEditorialMetadata } from '@/domain/entities/Snapshot';

describe('snapshot-serializer', () => {
  const chapters: SnapshotChapter[] = [
    { id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 },
  ];

  const editorialMetadata: SnapshotEditorialMetadata = {
    title: 'Mon roman',
    subtitle: 'Un sous-titre',
    summary: 'Un résumé',
    coverImageUrl: 'https://example.com/cover.jpg',
    genre: 'Fantasy',
    synopsis: 'Un synopsis',
    pointOfView: 'first_person',
    tense: 'past',
    targetAudience: 'adult',
    isbn: '978-3-16-148410-0',
    contributors: [{ name: 'Jane Doe', role: 'author' }],
    relatedWorks: [{ title: 'Tome 1', projectId: 'other-project' }],
  };

  const buildSnapshot = (overrides: Partial<ConstructorParameters<typeof Snapshot>[0]> = {}) =>
    new Snapshot({
      id: 'snapshot-1',
      projectId: 'project-1',
      ownerId: 'owner-1',
      authorId: 'owner-1',
      number: 3,
      type: 'manual',
      title: 'Version 3',
      comment: 'Un jalon éditorial',
      projectTitle: 'Mon roman',
      chapters,
      editorialMetadata,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      ...overrides,
    });

  describe('serializeSnapshot', () => {
    it('serializes a full snapshot to a document', () => {
      const snapshot = buildSnapshot();

      const doc = serializeSnapshot(snapshot);

      expect(doc).toEqual<SnapshotDocument>({
        _id: 'snapshot-1',
        projectId: 'project-1',
        ownerId: 'owner-1',
        authorId: 'owner-1',
        number: 3,
        type: 'manual',
        title: 'Version 3',
        comment: 'Un jalon éditorial',
        projectTitle: 'Mon roman',
        chapters,
        editorialMetadata,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      });
    });

    it('serializes null comment and null editorial metadata', () => {
      const snapshot = buildSnapshot({ comment: null, editorialMetadata: null });

      const doc = serializeSnapshot(snapshot);

      expect(doc.comment).toBeNull();
      expect(doc.editorialMetadata).toBeNull();
    });
  });

  describe('deserializeSnapshot', () => {
    it('reconstructs a Snapshot entity from a document', () => {
      const doc: SnapshotDocument = {
        _id: 'snapshot-1',
        projectId: 'project-1',
        ownerId: 'owner-1',
        authorId: 'owner-1',
        number: 3,
        type: 'manual',
        title: 'Version 3',
        comment: 'Un jalon éditorial',
        projectTitle: 'Mon roman',
        chapters,
        editorialMetadata,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      };

      const snapshot = deserializeSnapshot(doc);

      expect(snapshot).toBeInstanceOf(Snapshot);
      expect(snapshot.getId()).toBe('snapshot-1');
      expect(snapshot.getNumber()).toBe(3);
      expect(snapshot.getType()).toBe('manual');
      expect(snapshot.getComment()).toBe('Un jalon éditorial');
      expect(snapshot.getChapters()).toEqual(chapters);
      expect(snapshot.getEditorialMetadata()).toEqual(editorialMetadata);
      expect(snapshot.getCreatedAt().toISOString()).toBe('2026-01-01T10:00:00.000Z');
    });

    it('reconstructs a Snapshot with null editorial metadata', () => {
      const doc: SnapshotDocument = {
        _id: 'snapshot-1',
        projectId: 'project-1',
        ownerId: 'owner-1',
        authorId: 'owner-1',
        number: 1,
        type: 'manual',
        title: 'Version 1',
        comment: null,
        projectTitle: 'Mon roman',
        chapters,
        editorialMetadata: null,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      };

      const snapshot = deserializeSnapshot(doc);

      expect(snapshot.getEditorialMetadata()).toBeNull();
      expect(snapshot.getComment()).toBeNull();
    });

    it('round trips through serialize/deserialize', () => {
      const original = buildSnapshot();

      const roundTripped = deserializeSnapshot(serializeSnapshot(original));

      expect(roundTripped.getChapters()).toEqual(original.getChapters());
      expect(roundTripped.getEditorialMetadata()).toEqual(original.getEditorialMetadata());
      expect(roundTripped.getCreatedAt().toISOString()).toBe(original.getCreatedAt().toISOString());
    });
  });
});
