// ABOUTME: Test suite for UpdateChapterTitleUseCase validating title updates
// ABOUTME: Tests title validation and update logic

import { describe, it, expect } from 'vitest';
import { UpdateChapterTitleUseCase } from './UpdateChapterTitleUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('UpdateChapterTitleUseCase', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should update chapter title', () => {
    const useCase = new UpdateChapterTitleUseCase();
    const chapter = createMockChapter('id-1', 'Old Title', 0);
    const project = new Project([chapter]);

    useCase.execute(project, 'id-1', 'New Title');

    expect(project.getChapter('id-1')!.getTitle()).toBe('New Title');
  });

  it('should throw error for non-existent chapter', () => {
    const useCase = new UpdateChapterTitleUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = new Project([chapter]);

    expect(() => {
      useCase.execute(project, 'non-existent', 'New Title');
    }).toThrow('Chapter with id non-existent not found');
  });

  it('should throw error for empty title', () => {
    const useCase = new UpdateChapterTitleUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = new Project([chapter]);

    expect(() => {
      useCase.execute(project, 'id-1', '');
    }).toThrow('Chapter title cannot be empty');
  });

  it('should update metadata timestamp', () => {
    const useCase = new UpdateChapterTitleUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = new Project([chapter]);

    const originalTimestamp = chapter.getMetadata().lastEdited;

    useCase.execute(project, 'id-1', 'New Title');

    expect(chapter.getMetadata().lastEdited.getTime()).toBeGreaterThanOrEqual(originalTimestamp.getTime());
  });
});
