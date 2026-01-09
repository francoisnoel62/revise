// ABOUTME: Test suite for RemoveChapterUseCase validating chapter deletion logic
// ABOUTME: Tests removal with last chapter protection

import { describe, it, expect } from 'vitest';
import { RemoveChapterUseCase } from './RemoveChapterUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('RemoveChapterUseCase', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should remove chapter from project', () => {
    const useCase = new RemoveChapterUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    const project = Project.create('test-user', 'Test Project', chapters);

    useCase.execute(project, 'id-1');

    expect(project.getChapterCount()).toBe(1);
    expect(project.getChapter('id-1')).toBeNull();
    expect(project.getChapter('id-2')).not.toBeNull();
  });

  it('should throw error when removing last chapter', () => {
    const useCase = new RemoveChapterUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = Project.create('test-user', 'Test Project', [chapter]);

    expect(() => {
      useCase.execute(project, 'id-1');
    }).toThrow('Cannot remove the last chapter');
  });

  it('should handle removing non-existent chapter', () => {
    const useCase = new RemoveChapterUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    const project = Project.create('test-user', 'Test Project', chapters);

    expect(() => {
      useCase.execute(project, 'non-existent');
    }).toThrow('Chapter with id non-existent not found');
  });

  it('should allow removing multiple chapters sequentially', () => {
    const useCase = new RemoveChapterUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
      createMockChapter('id-3', 'Chapter 3', 2),
    ];
    const project = Project.create('test-user', 'Test Project', chapters);

    useCase.execute(project, 'id-1');
    useCase.execute(project, 'id-2');

    expect(project.getChapterCount()).toBe(1);
    expect(project.getChapter('id-3')).not.toBeNull();
  });
});
