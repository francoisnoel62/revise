import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryProjectRepository } from './InMemoryProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('InMemoryProjectRepository', () => {
  let repository: InMemoryProjectRepository;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
  });

  const createMockChapter = (): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter('id-1', 'Test Chapter', content, 0);
  };

  it('should save and load project', async () => {
    const chapter = createMockChapter();
    const project = new Project([chapter]);

    await repository.saveProject(project);
    const loaded = await repository.loadProject('any-id');

    expect(loaded).toBe(project);
  });

  it('should return null for non-existent project', async () => {
    const loaded = await repository.loadProject('non-existent');
    expect(loaded).toBeNull();
  });

  it('should delete project', async () => {
    const project = new Project();
    await repository.saveProject(project);
    await repository.deleteProject('any-id');

    const loaded = await repository.loadProject('any-id');
    expect(loaded).toBeNull();
  });

  it('should overwrite previous project when saving new one', async () => {
    const chapter1 = createMockChapter();
    const project1 = new Project([chapter1]);
    await repository.saveProject(project1);

    const chapter2 = new Chapter('id-2', 'Chapter 2', JSON.stringify({ type: 'doc', content: [] }), 0);
    const project2 = new Project([chapter2]);
    await repository.saveProject(project2);

    const loaded = await repository.loadProject('any-id');
    expect(loaded).toBe(project2);
    expect(loaded).not.toBe(project1);
  });

  it('should handle saveChapter gracefully', async () => {
    const chapter = createMockChapter();

    // Should not throw even though it's a no-op in Phase 2
    await expect(repository.saveChapter(chapter)).resolves.toBeUndefined();
  });
});
