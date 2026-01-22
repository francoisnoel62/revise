// ABOUTME: Tests for ResearchDocument entity
// ABOUTME: Covers creation, validation, computed properties, and mutations

import { describe, it, expect } from 'vitest';
import { ResearchDocument } from '../ResearchDocument';

describe('ResearchDocument', () => {
  describe('create', () => {
    it('creates a note document with minimal parameters', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'My Research Note'
      );

      expect(doc.getId()).toBe('doc-1');
      expect(doc.getProjectId()).toBe('project-1');
      expect(doc.getOwnerId()).toBe('user-1');
      expect(doc.getType()).toBe('note');
      expect(doc.getTitle()).toBe('My Research Note');
      expect(doc.getContent()).toBeNull();
      expect(doc.getUrl()).toBeNull();
      expect(doc.getSourceTitle()).toBeNull();
      expect(doc.getSourceAuthor()).toBeNull();
      expect(doc.getTags()).toEqual([]);
      expect(doc.getLinkedChapterIds()).toEqual([]);
    });

    it('creates a link document with URL', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'link',
        'Useful Article',
        { url: 'https://example.com/article' }
      );

      expect(doc.getType()).toBe('link');
      expect(doc.getUrl()).toBe('https://example.com/article');
      expect(doc.hasUrl()).toBe(true);
    });

    it('creates a quote document with content and source', () => {
      const content = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'To be or not to be' }] }],
      };
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'quote',
        'Famous Quote',
        {
          content,
          sourceTitle: 'Hamlet',
          sourceAuthor: 'Shakespeare',
        }
      );

      expect(doc.getType()).toBe('quote');
      expect(doc.hasContent()).toBe(true);
      expect(doc.hasSource()).toBe(true);
      expect(doc.getSourceTitle()).toBe('Hamlet');
      expect(doc.getSourceAuthor()).toBe('Shakespeare');
    });

    it('creates a reference document', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'reference',
        'Book Reference',
        {
          sourceTitle: 'The Art of Writing',
          sourceAuthor: 'Jane Author',
        }
      );

      expect(doc.getType()).toBe('reference');
      expect(doc.hasSource()).toBe(true);
    });

    it('creates a document with tags', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Tagged Note',
        { tags: ['history', 'medieval'] }
      );

      expect(doc.getTags()).toEqual(['history', 'medieval']);
      expect(doc.getTagCount()).toBe(2);
    });

    it('creates a document with linked chapters', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { linkedChapterIds: ['chapter-1', 'chapter-2'] }
      );

      expect(doc.getLinkedChapterIds()).toEqual(['chapter-1', 'chapter-2']);
      expect(doc.isLinkedToChapter('chapter-1')).toBe(true);
      expect(doc.isLinkedToChapter('chapter-3')).toBe(false);
    });

    it('trims the title', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        '  My Note  '
      );

      expect(doc.getTitle()).toBe('My Note');
    });

    it('throws error for empty title', () => {
      expect(() =>
        ResearchDocument.create('doc-1', 'project-1', 'user-1', 'note', '')
      ).toThrow('Research document title cannot be empty');
    });

    it('throws error for whitespace-only title', () => {
      expect(() =>
        ResearchDocument.create('doc-1', 'project-1', 'user-1', 'note', '   ')
      ).toThrow('Research document title cannot be empty');
    });

    it('throws error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() =>
        ResearchDocument.create('doc-1', 'project-1', 'user-1', 'note', longTitle)
      ).toThrow('Research document title cannot exceed 200 characters');
    });

    it('throws error for link type without URL', () => {
      expect(() =>
        ResearchDocument.create('doc-1', 'project-1', 'user-1', 'link', 'Missing URL')
      ).toThrow('Link type requires a URL');
    });

    it('throws error for quote type without content', () => {
      expect(() =>
        ResearchDocument.create('doc-1', 'project-1', 'user-1', 'quote', 'Empty Quote')
      ).toThrow('Quote type requires content');
    });
  });

  describe('computed properties', () => {
    it('hasUrl returns true when url exists', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'link',
        'Link',
        { url: 'https://example.com' }
      );

      expect(doc.hasUrl()).toBe(true);
    });

    it('hasUrl returns false when no url', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );

      expect(doc.hasUrl()).toBe(false);
    });

    it('hasContent returns true when content exists', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'quote',
        'Quote',
        { content: { type: 'doc', content: [] } }
      );

      expect(doc.hasContent()).toBe(true);
    });

    it('hasContent returns false when no content', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );

      expect(doc.hasContent()).toBe(false);
    });

    it('hasSource returns true when sourceTitle exists', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'reference',
        'Ref',
        { sourceTitle: 'Book Title' }
      );

      expect(doc.hasSource()).toBe(true);
    });

    it('hasSource returns true when sourceAuthor exists', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'reference',
        'Ref',
        { sourceAuthor: 'Author Name' }
      );

      expect(doc.hasSource()).toBe(true);
    });

    it('hasSource returns false when no source info', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );

      expect(doc.hasSource()).toBe(false);
    });
  });

  describe('updateTitle', () => {
    it('returns new instance with updated title', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Original'
      );
      const updated = doc.updateTitle('New Title');

      expect(updated.getTitle()).toBe('New Title');
      expect(doc.getTitle()).toBe('Original'); // Original unchanged
    });

    it('throws error for invalid title', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Title'
      );

      expect(() => doc.updateTitle('')).toThrow();
    });
  });

  describe('updateContent', () => {
    it('returns new instance with updated content', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );
      const newContent = { type: 'doc', content: [] };
      const updated = doc.updateContent(newContent);

      expect(updated.getContent()).toEqual(newContent);
      expect(doc.getContent()).toBeNull();
    });

    it('can set content to null', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { content: { type: 'doc', content: [] } }
      );
      const updated = doc.updateContent(null);

      expect(updated.getContent()).toBeNull();
    });
  });

  describe('updateUrl', () => {
    it('returns new instance with updated url', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'link',
        'Link',
        { url: 'https://old.com' }
      );
      const updated = doc.updateUrl('https://new.com');

      expect(updated.getUrl()).toBe('https://new.com');
      expect(doc.getUrl()).toBe('https://old.com');
    });

    it('throws error when setting null URL on link type', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'link',
        'Link',
        { url: 'https://example.com' }
      );

      expect(() => doc.updateUrl(null)).toThrow('Link type requires a URL');
    });

    it('can set url to null on non-link type', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'reference',
        'Ref',
        { url: 'https://example.com' }
      );
      const updated = doc.updateUrl(null);

      expect(updated.getUrl()).toBeNull();
    });
  });

  describe('updateSource', () => {
    it('returns new instance with updated source', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'reference',
        'Ref'
      );
      const updated = doc.updateSource('Book Title', 'Author Name');

      expect(updated.getSourceTitle()).toBe('Book Title');
      expect(updated.getSourceAuthor()).toBe('Author Name');
      expect(doc.getSourceTitle()).toBeNull();
    });
  });

  describe('tags', () => {
    it('addTag adds a new tag', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );
      const updated = doc.addTag('important');

      expect(updated.getTags()).toContain('important');
    });

    it('addTag normalizes to lowercase', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );
      const updated = doc.addTag('IMPORTANT');

      expect(updated.getTags()).toContain('important');
    });

    it('addTag does not duplicate existing tag', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { tags: ['important'] }
      );
      const updated = doc.addTag('important');

      expect(updated.getTags()).toEqual(['important']);
      expect(updated).toBe(doc); // Same instance returned
    });

    it('removeTag removes a tag', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { tags: ['important', 'draft'] }
      );
      const updated = doc.removeTag('important');

      expect(updated.getTags()).toEqual(['draft']);
    });

    it('removeTag returns same instance when tag does not exist', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { tags: ['existing'] }
      );
      const updated = doc.removeTag('nonexistent');

      expect(updated).toBe(doc);
    });

    it('updateTags replaces all tags', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { tags: ['old1', 'old2'] }
      );
      const updated = doc.updateTags(['new1', 'new2']);

      expect(updated.getTags()).toEqual(['new1', 'new2']);
    });
  });

  describe('chapter linking', () => {
    it('linkToChapter adds chapter ID', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note'
      );
      const updated = doc.linkToChapter('chapter-1');

      expect(updated.getLinkedChapterIds()).toContain('chapter-1');
      expect(updated.isLinkedToChapter('chapter-1')).toBe(true);
    });

    it('linkToChapter does not duplicate', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { linkedChapterIds: ['chapter-1'] }
      );
      const updated = doc.linkToChapter('chapter-1');

      expect(updated.getLinkedChapterIds()).toEqual(['chapter-1']);
      expect(updated).toBe(doc);
    });

    it('unlinkFromChapter removes chapter ID', () => {
      const doc = ResearchDocument.create(
        'doc-1',
        'project-1',
        'user-1',
        'note',
        'Note',
        { linkedChapterIds: ['chapter-1', 'chapter-2'] }
      );
      const updated = doc.unlinkFromChapter('chapter-1');

      expect(updated.getLinkedChapterIds()).toEqual(['chapter-2']);
      expect(updated.isLinkedToChapter('chapter-1')).toBe(false);
    });
  });

  describe('reconstruct', () => {
    it('reconstructs from properties', () => {
      const createdAt = new Date('2024-01-15');
      const updatedAt = new Date('2024-01-20');

      const doc = ResearchDocument.reconstruct({
        id: 'doc-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        type: 'reference',
        title: 'Book Reference',
        content: null,
        url: null,
        sourceTitle: 'The Art of Writing',
        sourceAuthor: 'Jane Author',
        tags: ['writing', 'craft'],
        linkedChapterIds: [],
        createdAt,
        updatedAt,
      });

      expect(doc.getId()).toBe('doc-1');
      expect(doc.getCreatedAt()).toEqual(createdAt);
      expect(doc.getUpdatedAt()).toEqual(updatedAt);
      expect(doc.getTags()).toEqual(['writing', 'craft']);
    });
  });
});
