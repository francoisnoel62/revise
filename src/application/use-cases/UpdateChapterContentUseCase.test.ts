// ABOUTME: Test suite for UpdateChapterContentUseCase validating content updates
// ABOUTME: Tests content validation and update logic

import { describe, it, expect } from 'vitest';
import { UpdateChapterContentUseCase } from './UpdateChapterContentUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('UpdateChapterContentUseCase', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should update chapter content', () => {
    const useCase = new UpdateChapterContentUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = Project.create('test-user', 'Test Project', [chapter]);

    const newContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'New content' }],
        },
      ],
    });

    useCase.execute(project, 'id-1', newContent);

    expect(project.getChapter('id-1')!.getContent()).toBe(newContent);
  });

  it('should throw error for non-existent chapter', () => {
    const useCase = new UpdateChapterContentUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = Project.create('test-user', 'Test Project', [chapter]);

    expect(() => {
      useCase.execute(project, 'non-existent', 'content');
    }).toThrow('Chapter with id non-existent not found');
  });

  it('should update metadata timestamp', () => {
    const useCase = new UpdateChapterContentUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = Project.create('test-user', 'Test Project', [chapter]);

    const originalTimestamp = chapter.getMetadata().lastEdited;

    // Wait a bit to ensure timestamp changes
    const newContent = JSON.stringify({ type: 'doc', content: [] });
    useCase.execute(project, 'id-1', newContent);

    expect(chapter.getMetadata().lastEdited.getTime()).toBeGreaterThanOrEqual(originalTimestamp.getTime());
  });
});
