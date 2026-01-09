// ABOUTME: Test suite for SwitchChapterUseCase validating chapter switching logic
// ABOUTME: Tests automatic content saving before chapter switch

import { describe, it, expect } from 'vitest';
import { SwitchChapterUseCase } from './SwitchChapterUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('SwitchChapterUseCase', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should save current chapter content before switching', async () => {
    const useCase = new SwitchChapterUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    const project = Project.create('test-user', 'Test Project', chapters);

    const newContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Updated content' }],
        },
      ],
    });

    await useCase.execute(project, 'id-2', newContent);

    const chapter1 = project.getChapter('id-1');
    expect(chapter1!.getContent()).toBe(newContent);
    expect(project.getActiveChapterId()).toBe('id-2');
  });

  it('should handle empty current content', async () => {
    const useCase = new SwitchChapterUseCase();
    const chapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    const project = Project.create('test-user', 'Test Project', chapters);

    await useCase.execute(project, 'id-2', '');

    expect(project.getActiveChapterId()).toBe('id-2');
  });

  it('should throw error for non-existent chapter', async () => {
    const useCase = new SwitchChapterUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = Project.create('test-user', 'Test Project', [chapter]);

    await expect(
      useCase.execute(project, 'non-existent', '')
    ).rejects.toThrow('Chapter with id non-existent not found');
  });

  it('should handle switching to same chapter', async () => {
    const useCase = new SwitchChapterUseCase();
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    const project = Project.create('test-user', 'Test Project', [chapter]);

    const newContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    });

    await useCase.execute(project, 'id-1', newContent);

    expect(project.getChapter('id-1')!.getContent()).toBe(newContent);
    expect(project.getActiveChapterId()).toBe('id-1');
  });

  it('should not save content when no active chapter', async () => {
    const useCase = new SwitchChapterUseCase();
    const project = Project.createEmpty('test-user', 'Test Project'); // Empty project
    const chapter = createMockChapter('id-1', 'Chapter 1', 0);
    project.addChapter(chapter);

    // Should not throw, just switches without saving (empty content)
    await useCase.execute(project, 'id-1', '');

    expect(project.getActiveChapterId()).toBe('id-1');
  });
});
