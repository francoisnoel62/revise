import { describe, it, expect } from 'vitest';
import { Project } from './Project';
import { Chapter } from './Chapter';

describe('Project', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: `Content for ${title}` }],
        },
      ],
    });
    return new Chapter(id, title, content, order);
  };

  // Helper function for tests that don't care about ownership
  const createTestProject = (title: string = 'Test Project', chapters: Chapter[] = []): Project => {
    return Project.create('test-user-id', title, chapters);
  };

  describe('constructor and factories', () => {
    it('should create empty project with factory', () => {
      const project = createTestProject('Empty', []);

      expect(project.isEmpty()).toBe(true);
      expect(project.getChapterCount()).toBe(0);
      expect(project.getActiveChapterId()).toBeNull();
    });

    it('should create project with chapters', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      expect(project.getChapterCount()).toBe(2);
      expect(project.getActiveChapterId()).toBe('id-1');
    });

    it('should set first chapter as active', () => {
      const chapters = [createMockChapter('id-1', 'Chapter 1', 0)];
      const project = createTestProject('Test', chapters);

      expect(project.getActiveChapterId()).toBe('id-1');
    });
  });

  describe('Project ownership', () => {
    it('stores ownerId from factory method', () => {
      const project = Project.create('user-123', 'My Project', []);

      expect(project.getOwnerId()).toBe('user-123');
    });

    it('generates unique ID', () => {
      const project1 = Project.create('user-1', 'Project 1', []);
      const project2 = Project.create('user-1', 'Project 2', []);

      expect(project1.getId()).not.toBe(project2.getId());
    });

    it('sets timestamps on creation', () => {
      const before = new Date();
      const project = Project.create('user-1', 'Test', []);
      const after = new Date();

      expect(project.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(project.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
      expect(project.getUpdatedAt()).toEqual(project.getCreatedAt());
    });

    it('updates updatedAt on mutations', async () => {
      const project = Project.create('user-1', 'Test', []);
      const initialUpdatedAt = project.getUpdatedAt();

      // Wait a tick to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      project.updateTitle('New Title');

      expect(project.getUpdatedAt().getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('Project.createEmpty', () => {
    it('creates project with default chapter', () => {
      const project = Project.createEmpty('user-123');

      expect(project.getChapterCount()).toBe(1);
      expect(project.getChapters()[0].getTitle()).toBe('Chapitre 1');
    });

    it('uses provided title', () => {
      const project = Project.createEmpty('user-123', 'Mon Roman');

      expect(project.getTitle()).toBe('Mon Roman');
    });
  });

  describe('Project title', () => {
    it('updates title', () => {
      const project = Project.create('user-1', 'Original', []);

      project.updateTitle('Updated Title');

      expect(project.getTitle()).toBe('Updated Title');
    });

    it('trims whitespace from title', () => {
      const project = Project.create('user-1', 'Original', []);

      project.updateTitle('  Trimmed  ');

      expect(project.getTitle()).toBe('Trimmed');
    });

    it('throws on empty title', () => {
      const project = Project.create('user-1', 'Original', []);

      expect(() => project.updateTitle('')).toThrow('Project title cannot be empty');
      expect(() => project.updateTitle('   ')).toThrow('Project title cannot be empty');
    });
  });

  describe('getChapters', () => {
    it('should return chapters sorted by order', () => {
      const chapters = [
        createMockChapter('id-3', 'Chapter 3', 2),
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      const sorted = project.getChapters();
      expect(sorted[0].getId()).toBe('id-1');
      expect(sorted[1].getId()).toBe('id-2');
      expect(sorted[2].getId()).toBe('id-3');
    });

    it('should return defensive copy', () => {
      const chapters = [createMockChapter('id-1', 'Chapter 1', 0)];
      const project = createTestProject('Test', chapters);

      const chapters1 = project.getChapters();
      const chapters2 = project.getChapters();

      expect(chapters1).not.toBe(chapters2);
      expect(chapters1).toEqual(chapters2);
    });
  });

  describe('getChapter', () => {
    it('should return chapter by id', () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = createTestProject('Test', [chapter]);

      const found = project.getChapter('id-1');
      expect(found).toBe(chapter);
    });

    it('should return null for non-existent id', () => {
      const project = createTestProject();
      expect(project.getChapter('non-existent')).toBeNull();
    });
  });

  describe('setActiveChapter', () => {
    it('should set active chapter successfully', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      project.setActiveChapter('id-2');
      expect(project.getActiveChapterId()).toBe('id-2');
    });

    it('should throw error for non-existent chapter', () => {
      const project = createTestProject();

      expect(() => project.setActiveChapter('non-existent')).toThrow(
        'Chapter with id non-existent not found'
      );
    });
  });

  describe('addChapter', () => {
    it('should add chapter successfully', () => {
      const project = createTestProject();
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);

      project.addChapter(chapter);

      expect(project.getChapterCount()).toBe(1);
      expect(project.getChapter('id-1')).toBe(chapter);
    });

    it('should set first chapter as active', () => {
      const project = createTestProject();
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);

      project.addChapter(chapter);

      expect(project.getActiveChapterId()).toBe('id-1');
    });

    it('should not change active chapter when adding subsequent chapters', () => {
      const chapter1 = createMockChapter('id-1', 'Chapter 1', 0);
      const chapter2 = createMockChapter('id-2', 'Chapter 2', 1);
      const project = createTestProject('Test', [chapter1]);

      project.addChapter(chapter2);

      expect(project.getActiveChapterId()).toBe('id-1');
    });

    it('should throw error for duplicate id', () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const duplicate = createMockChapter('id-1', 'Duplicate', 1);
      const project = createTestProject('Test', [chapter]);

      expect(() => project.addChapter(duplicate)).toThrow(
        'Chapter with id id-1 already exists'
      );
    });
  });

  describe('removeChapter', () => {
    it('should remove chapter successfully', () => {
      const chapter1 = createMockChapter('id-1', 'Chapter 1', 0);
      const chapter2 = createMockChapter('id-2', 'Chapter 2', 1);
      const project = createTestProject('Test', [chapter1, chapter2]);

      project.removeChapter('id-1');

      expect(project.getChapterCount()).toBe(1);
      expect(project.getChapter('id-1')).toBeNull();
    });

    it('should throw error when trying to remove last chapter', () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = createTestProject('Test', [chapter]);

      expect(() => project.removeChapter('id-1')).toThrow(
        'Cannot remove the last chapter'
      );
    });

    it('should update active chapter if removed', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      project.removeChapter('id-1');

      expect(project.getActiveChapterId()).toBe('id-2');
    });

    it('should throw error for non-existent chapter', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      expect(() => project.removeChapter('non-existent')).toThrow(
        'Chapter with id non-existent not found'
      );
    });
  });

  describe('reorderChapters', () => {
    it('should reorder chapters successfully', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
        createMockChapter('id-3', 'Chapter 3', 2),
      ];
      const project = createTestProject('Test', chapters);

      project.reorderChapters(0, 2); // Move first to last

      const sorted = project.getChapters();
      expect(sorted[0].getId()).toBe('id-2');
      expect(sorted[1].getId()).toBe('id-3');
      expect(sorted[2].getId()).toBe('id-1');
    });

    it('should update order property on chapters', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      project.reorderChapters(0, 1);

      const sorted = project.getChapters();
      expect(sorted[0].getOrder()).toBe(0);
      expect(sorted[1].getOrder()).toBe(1);
    });

    it('should throw error for invalid fromIndex', () => {
      const project = createTestProject('Test', [createMockChapter('id-1', 'Chapter 1', 0)]);

      expect(() => project.reorderChapters(-1, 0)).toThrow('Invalid fromIndex: -1');
      expect(() => project.reorderChapters(5, 0)).toThrow('Invalid fromIndex: 5');
    });

    it('should throw error for invalid toIndex', () => {
      const project = createTestProject('Test', [createMockChapter('id-1', 'Chapter 1', 0)]);

      expect(() => project.reorderChapters(0, -1)).toThrow('Invalid toIndex: -1');
      expect(() => project.reorderChapters(0, 5)).toThrow('Invalid toIndex: 5');
    });
  });

  describe('project-level metadata', () => {
    it('should calculate total word count', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0), // "Content for Chapter 1" = 4 words
        createMockChapter('id-2', 'Chapter 2', 1), // "Content for Chapter 2" = 4 words
      ];
      const project = createTestProject('Test', chapters);

      expect(project.getTotalWordCount()).toBe(8);
    });

    it('should calculate total character count', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = createTestProject('Test', chapters);

      const expected =
        'Content for Chapter 1'.length + 'Content for Chapter 2'.length;
      expect(project.getTotalCharacterCount()).toBe(expected);
    });
  });
});
