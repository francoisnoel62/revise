import { describe, it, expect } from 'vitest';
import { ProjectMetadata } from '../ProjectMetadata';

describe('ProjectMetadata', () => {
  const validContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content' }] }],
  });

  describe('constructor', () => {
    it('should create metadata with valid parameters', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Analyse Narrative',
        validContent
      );

      expect(metadata.getId()).toBe('meta-1');
      expect(metadata.getProjectId()).toBe('project-1');
      expect(metadata.getTypeKey()).toBe('narrative-analysis');
      expect(metadata.getTitle()).toBe('Analyse Narrative');
      expect(metadata.getContent()).toBe(validContent);
    });

    it('should throw error for empty ID', () => {
      expect(() => new ProjectMetadata('', 'project-1', 'narrative-analysis', 'Title', validContent))
        .toThrow('Metadata ID cannot be empty');
    });

    it('should throw error for empty project ID', () => {
      expect(() => new ProjectMetadata('meta-1', '', 'narrative-analysis', 'Title', validContent))
        .toThrow('Project ID cannot be empty');
    });

    it('should throw error for empty type key', () => {
      expect(() => new ProjectMetadata('meta-1', 'project-1', '', 'Title', validContent))
        .toThrow('Metadata type key cannot be empty');
    });

    it('should throw error for invalid type key', () => {
      expect(() => new ProjectMetadata('meta-1', 'project-1', 'invalid-type', 'Title', validContent))
        .toThrow('Invalid metadata type: invalid-type');
    });

    it('should throw error for empty title', () => {
      expect(() => new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', '', validContent))
        .toThrow('Metadata title cannot be empty');
    });

    it('should throw error for invalid TipTap JSON', () => {
      expect(() => new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', '{}'))
        .toThrow('Invalid TipTap JSON: must have type "doc"');
    });

    it('should throw error for invalid JSON string', () => {
      expect(() => new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', 'not json'))
        .toThrow('Invalid JSON format for metadata content');
    });

    it('should calculate word count from content', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title',
        validContent
      );
      expect(metadata.getProperties().wordCount).toBe(2); // "Test content"
    });

    it('should calculate character count from content', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title',
        validContent
      );
      expect(metadata.getProperties().characterCount).toBe(12); // "Test content"
    });

    it('should set default properties when not provided', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title',
        validContent
      );
      const props = metadata.getProperties();

      expect(props.wordCount).toBe(2);
      expect(props.characterCount).toBe(12);
      expect(props.lastEdited).toBeInstanceOf(Date);
      expect(props.generatedAt).toBeNull();
      expect(props.isGenerated).toBe(false);
    });

    it('should use provided properties', () => {
      const generatedAt = new Date('2024-01-01');
      const lastEdited = new Date('2024-01-02');

      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title',
        validContent,
        {
          wordCount: 100,
          characterCount: 500,
          lastEdited,
          generatedAt,
          isGenerated: true,
        }
      );
      const props = metadata.getProperties();

      // Word count and character count should be recalculated from content
      expect(props.wordCount).toBe(2);
      expect(props.characterCount).toBe(12);
      expect(props.lastEdited).toEqual(lastEdited);
      expect(props.generatedAt).toEqual(generatedAt);
      expect(props.isGenerated).toBe(true);
    });

    it('should trim title', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        '  Title with spaces  ',
        validContent
      );
      expect(metadata.getTitle()).toBe('Title with spaces');
    });
  });

  describe('getters', () => {
    it('should return a copy of properties', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title',
        validContent
      );
      const props1 = metadata.getProperties();
      const props2 = metadata.getProperties();

      expect(props1).not.toBe(props2); // Different objects
      expect(props1).toEqual(props2); // But same values
    });

    it('should return isGenerated correctly', () => {
      const metadata = new ProjectMetadata(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Title',
        validContent,
        { isGenerated: true }
      );
      expect(metadata.isGenerated()).toBe(true);
    });
  });

  describe('updateTitle', () => {
    it('should update title and lastEdited', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Old Title', validContent);

      // Wait a tiny bit to ensure timestamp differs
      const now = new Date();
      metadata.updateTitle('New Title');

      expect(metadata.getTitle()).toBe('New Title');
      expect(metadata.getProperties().lastEdited.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });

    it('should throw error for empty title', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      expect(() => metadata.updateTitle('')).toThrow('Metadata title cannot be empty');
    });

    it('should trim new title', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      metadata.updateTitle('  New Title  ');
      expect(metadata.getTitle()).toBe('New Title');
    });
  });

  describe('updateContent', () => {
    it('should update content and recalculate metrics', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);

      const newContent = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'One two three four five' }] }],
      });

      metadata.updateContent(newContent);

      expect(metadata.getContent()).toBe(newContent);
      expect(metadata.getProperties().wordCount).toBe(5);
    });

    it('should throw error for invalid TipTap JSON', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      expect(() => metadata.updateContent('{}')).toThrow('Invalid TipTap JSON: must have type "doc"');
    });

    it('should update lastEdited', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      const now = new Date();

      metadata.updateContent(validContent);

      expect(metadata.getProperties().lastEdited.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe('markAsGenerated', () => {
    it('should set generated flags', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);

      expect(metadata.isGenerated()).toBe(false);
      expect(metadata.getProperties().generatedAt).toBeNull();

      const now = new Date();
      metadata.markAsGenerated();

      expect(metadata.isGenerated()).toBe(true);
      expect(metadata.getProperties().generatedAt).toBeInstanceOf(Date);
      expect(metadata.getProperties().generatedAt!.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });

    it('should update lastEdited', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      const now = new Date();

      metadata.markAsGenerated();

      expect(metadata.getProperties().lastEdited.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe('getStructuredData / updateStructuredData', () => {
    it('should return null by default', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      expect(metadata.getStructuredData()).toBeNull();
    });

    it('should return structuredData when provided in properties', () => {
      const data = JSON.stringify({ narratorType: 'Première personne' });
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent, {
        structuredData: data,
      });
      expect(metadata.getStructuredData()).toBe(data);
    });

    it('should update structuredData via updateStructuredData', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent);
      const data = JSON.stringify({ narratorType: 'Troisième personne' });
      metadata.updateStructuredData(data);
      expect(metadata.getStructuredData()).toBe(data);
    });

    it('should allow setting structuredData to null', () => {
      const metadata = new ProjectMetadata('meta-1', 'project-1', 'narrative-analysis', 'Title', validContent, {
        structuredData: '{}',
      });
      metadata.updateStructuredData(null);
      expect(metadata.getStructuredData()).toBeNull();
    });
  });

  describe('createGenerated with structuredData', () => {
    it('should store structuredData when provided', () => {
      const data = JSON.stringify({ narratorType: 'Première personne', narrativeVoice: ['Ironie', 'Distance'] });
      const metadata = ProjectMetadata.createGenerated(
        'meta-1', 'project-1', 'narrative-analysis', 'Analyse Narrative', validContent, 'hash-1', data
      );
      expect(metadata.getStructuredData()).toBe(data);
    });

    it('should have null structuredData when not provided', () => {
      const metadata = ProjectMetadata.createGenerated(
        'meta-1', 'project-1', 'narrative-analysis', 'Analyse Narrative', validContent, 'hash-1'
      );
      expect(metadata.getStructuredData()).toBeNull();
    });

    it('should have null structuredData when explicitly passed null', () => {
      const metadata = ProjectMetadata.createGenerated(
        'meta-1', 'project-1', 'narrative-analysis', 'Analyse Narrative', validContent, 'hash-1', null
      );
      expect(metadata.getStructuredData()).toBeNull();
    });
  });

  describe('createEmpty', () => {
    it('should have null structuredData', () => {
      const metadata = ProjectMetadata.createEmpty('meta-1', 'project-1', 'narrative-analysis', 'Empty');
      expect(metadata.getStructuredData()).toBeNull();
    });

    it('should create metadata with empty TipTap document', () => {
      const metadata = ProjectMetadata.createEmpty(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Empty Analysis'
      );

      expect(metadata.getId()).toBe('meta-1');
      expect(metadata.getProjectId()).toBe('project-1');
      expect(metadata.getTypeKey()).toBe('narrative-analysis');
      expect(metadata.getTitle()).toBe('Empty Analysis');
      expect(metadata.getProperties().wordCount).toBe(0);
      expect(metadata.getProperties().characterCount).toBe(0);
    });

    it('should have valid empty TipTap JSON', () => {
      const metadata = ProjectMetadata.createEmpty(
        'meta-1',
        'project-1',
        'narrative-analysis',
        'Empty'
      );

      const content = JSON.parse(metadata.getContent());
      expect(content.type).toBe('doc');
      expect(content.content).toBeInstanceOf(Array);
      expect(content.content[0].type).toBe('paragraph');
    });
  });
});
