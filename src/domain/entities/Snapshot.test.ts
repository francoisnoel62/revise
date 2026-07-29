// ABOUTME: Tests for the Snapshot domain entity
// ABOUTME: Verifies immutability, validation, and the captured manuscript payload

import { describe, it, expect } from 'vitest';
import { Snapshot, SnapshotChapter, SnapshotEditorialMetadata } from './Snapshot';

describe('Snapshot', () => {
  const chapters: SnapshotChapter[] = [
    { id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc","content":[]}', order: 0 },
    { id: 'chapter-2', title: 'Chapitre 2', content: '{"type":"doc","content":[]}', order: 1 },
  ];

  const editorialMetadata: SnapshotEditorialMetadata = {
    title: 'Mon roman',
    summary: 'Un résumé',
    genre: 'Fantasy',
    synopsis: 'Un synopsis',
    contributors: [],
    relatedWorks: [],
  };

  const validProps = {
    id: 'snapshot-1',
    projectId: 'project-1',
    ownerId: 'owner-1',
    authorId: 'owner-1',
    number: 1,
    type: 'manual' as const,
    title: 'Version 1',
    comment: null,
    projectTitle: 'Mon roman',
    chapters,
    editorialMetadata,
  };

  describe('constructor', () => {
    it('creates a snapshot with valid data', () => {
      const snapshot = new Snapshot(validProps);

      expect(snapshot.getId()).toBe('snapshot-1');
      expect(snapshot.getProjectId()).toBe('project-1');
      expect(snapshot.getOwnerId()).toBe('owner-1');
      expect(snapshot.getAuthorId()).toBe('owner-1');
      expect(snapshot.getNumber()).toBe(1);
      expect(snapshot.getType()).toBe('manual');
      expect(snapshot.getTitle()).toBe('Version 1');
      expect(snapshot.getComment()).toBeNull();
      expect(snapshot.getProjectTitle()).toBe('Mon roman');
      expect(snapshot.getChapters()).toEqual(chapters);
      expect(snapshot.getEditorialMetadata()).toEqual(editorialMetadata);
      expect(snapshot.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('defaults createdAt to now when not provided', () => {
      const before = new Date();
      const snapshot = new Snapshot(validProps);
      const after = new Date();

      expect(snapshot.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(snapshot.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('accepts an explicit createdAt', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const snapshot = new Snapshot({ ...validProps, createdAt });

      expect(snapshot.getCreatedAt().toISOString()).toBe(createdAt.toISOString());
    });

    it('accepts an optional comment', () => {
      const snapshot = new Snapshot({ ...validProps, comment: 'Fin de la partie 1' });

      expect(snapshot.getComment()).toBe('Fin de la partie 1');
    });

    it('accepts null editorial metadata when settings do not exist yet', () => {
      const snapshot = new Snapshot({ ...validProps, editorialMetadata: null });

      expect(snapshot.getEditorialMetadata()).toBeNull();
    });

    it('throws if id is empty', () => {
      expect(() => new Snapshot({ ...validProps, id: '' })).toThrow('Snapshot ID cannot be empty');
    });

    it('throws if projectId is empty', () => {
      expect(() => new Snapshot({ ...validProps, projectId: '' })).toThrow('Project ID cannot be empty');
    });

    it('throws if ownerId is empty', () => {
      expect(() => new Snapshot({ ...validProps, ownerId: '' })).toThrow('Owner ID cannot be empty');
    });

    it('throws if authorId is empty', () => {
      expect(() => new Snapshot({ ...validProps, authorId: '' })).toThrow('Author ID cannot be empty');
    });

    it('throws if number is not a positive integer', () => {
      expect(() => new Snapshot({ ...validProps, number: 0 })).toThrow('Snapshot number must be a positive integer');
      expect(() => new Snapshot({ ...validProps, number: -1 })).toThrow('Snapshot number must be a positive integer');
      expect(() => new Snapshot({ ...validProps, number: 1.5 })).toThrow('Snapshot number must be a positive integer');
    });

    it('throws for an invalid type', () => {
      expect(
        () => new Snapshot({ ...validProps, type: 'draft' as unknown as 'manual' })
      ).toThrow('Invalid snapshot type: draft');
    });

    it('throws if title is empty', () => {
      expect(() => new Snapshot({ ...validProps, title: '' })).toThrow('Snapshot title cannot be empty');
      expect(() => new Snapshot({ ...validProps, title: '   ' })).toThrow('Snapshot title cannot be empty');
    });

    it('throws if chapters is empty', () => {
      expect(() => new Snapshot({ ...validProps, chapters: [] })).toThrow(
        'Snapshot must capture at least one chapter'
      );
    });

    it('defaults sourceSnapshotNumber to null', () => {
      const snapshot = new Snapshot(validProps);

      expect(snapshot.getSourceSnapshotNumber()).toBeNull();
    });

    it('accepts a sourceSnapshotNumber for a restore snapshot', () => {
      const snapshot = new Snapshot({
        ...validProps,
        type: 'restore',
        sourceSnapshotNumber: 4,
      });

      expect(snapshot.getSourceSnapshotNumber()).toBe(4);
    });

    it('requires sourceSnapshotNumber for a restore snapshot', () => {
      expect(() => new Snapshot({ ...validProps, type: 'restore' })).toThrow(
        'Restore snapshot must reference its source snapshot number'
      );
    });

    it('throws if sourceSnapshotNumber is not a positive integer', () => {
      expect(
        () =>
          new Snapshot({
            ...validProps,
            type: 'restore',
            sourceSnapshotNumber: 0,
          })
      ).toThrow('Source snapshot number must be a positive integer');
    });

    it('rejects a sourceSnapshotNumber on a non-restore snapshot', () => {
      expect(
        () =>
          new Snapshot({
            ...validProps,
            type: 'manual',
            sourceSnapshotNumber: 4,
          })
      ).toThrow('Only a restore snapshot may reference a source snapshot number');
    });
  });

  describe('immutability', () => {
    it('has no mutation methods and returns defensive copies', () => {
      const snapshot = new Snapshot(validProps);

      const returnedChapters = snapshot.getChapters();
      returnedChapters.push({ id: 'intruder', title: 'x', content: 'x', order: 99 });
      expect(snapshot.getChapters()).toHaveLength(2);

      const returnedMetadata = snapshot.getEditorialMetadata();
      expect(returnedMetadata).not.toBe(editorialMetadata);
    });
  });
});
