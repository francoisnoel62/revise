// ABOUTME: Test suite for AddChapterUseCase validating chapter creation logic
// ABOUTME: Tests chapter generation with auto-naming and ordering

import { describe, it, expect } from 'vitest';
import { AddChapterUseCase } from './AddChapterUseCase';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('AddChapterUseCase', () => {
  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should add new chapter to empty project', () => {
    const useCase = new AddChapterUseCase();
    const project = Project.create('test-user', 'Test Project', []);

    const chapter = useCase.execute(project);

    expect(project.getChapterCount()).toBe(1);
    expect(chapter.getTitle()).toBe('Chapitre 1');
    expect(chapter.getOrder()).toBe(0);
  });

  it('should add new chapter with sequential numbering', () => {
    const useCase = new AddChapterUseCase();
    const existingChapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    const project = Project.create('test-user', 'Test Project', existingChapters);

    const chapter = useCase.execute(project);

    expect(project.getChapterCount()).toBe(3);
    expect(chapter.getTitle()).toBe('Chapitre 3');
    expect(chapter.getOrder()).toBe(2);
  });

  it('should create chapter starting with a titre-de-chapitre H1 (no fallback needed at export)', () => {
    const useCase = new AddChapterUseCase();
    const project = Project.create('test-user', 'Test Project', []);

    const chapter = useCase.execute(project);

    const content = JSON.parse(chapter.getContent());
    expect(content.type).toBe('doc');
    expect(content.content).toHaveLength(1);
    expect(content.content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
    });
  });

  it('should generate unique chapter IDs', () => {
    const useCase = new AddChapterUseCase();
    const project = Project.create('test-user', 'Test Project', []);

    const chapter1 = useCase.execute(project);
    const chapter2 = useCase.execute(project);

    expect(chapter1.getId()).not.toBe(chapter2.getId());
    expect(project.getChapterCount()).toBe(2);
  });

  it('should add chapter to project', () => {
    const useCase = new AddChapterUseCase();
    const project = Project.createEmpty('test-user', 'Test Project');

    const chapter = useCase.execute(project);

    expect(project.getChapter(chapter.getId())).toBe(chapter);
  });
});
