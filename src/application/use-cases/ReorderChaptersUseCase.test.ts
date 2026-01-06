// ABOUTME: Test suite for ReorderChaptersUseCase validating chapter reordering
// ABOUTME: Tests drag and drop reordering logic delegation

import { describe, it, expect } from 'vitest';
import { ReorderChaptersUseCase } from './ReorderChaptersUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('ReorderChaptersUseCase', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should reorder chapters correctly', () => {
    const useCase = new ReorderChaptersUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
      createMockChapter('id-3', 'Chapter 3', 2),
    ];
    const project = new Project(chapters);

    useCase.execute(project, 0, 2); // Move first to last

    const reorderedChapters = project.getChapters();
    expect(reorderedChapters[0].getId()).toBe('id-2');
    expect(reorderedChapters[1].getId()).toBe('id-3');
    expect(reorderedChapters[2].getId()).toBe('id-1');
  });

  it('should handle reordering to same position', () => {
    const useCase = new ReorderChaptersUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    const project = new Project(chapters);

    useCase.execute(project, 0, 0);

    const reorderedChapters = project.getChapters();
    expect(reorderedChapters[0].getId()).toBe('id-1');
    expect(reorderedChapters[1].getId()).toBe('id-2');
  });

  it('should throw error for invalid indices', () => {
    const useCase = new ReorderChaptersUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = new Project([chapter]);

    expect(() => {
      useCase.execute(project, 0, 5);
    }).toThrow('Invalid toIndex');
  });
});
