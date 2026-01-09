// ABOUTME: Tests for InMemoryProjectRepository multi-tenant behavior.

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryProjectRepository } from './InMemoryProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('InMemoryProjectRepository', () => {
  let repository: InMemoryProjectRepository;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
  });

  describe('createProject', () => {
    it('stores project for user', async () => {
      const project = Project.create('user-1', 'Test Project', []);

      await repository.createProject('user-1', project);

      const loaded = await repository.loadProject('user-1', project.getId());
      expect(loaded).not.toBeNull();
      expect(loaded?.getTitle()).toBe('Test Project');
    });

    it('throws if ownerId does not match userId', async () => {
      const project = Project.create('user-1', 'Test', []);

      await expect(
        repository.createProject('user-2', project)
      ).rejects.toThrow('ownerId does not match');
    });

    it('throws if project already exists', async () => {
      const project = Project.create('user-1', 'Test', []);
      await repository.createProject('user-1', project);

      await expect(
        repository.createProject('user-1', project)
      ).rejects.toThrow('already exists');
    });
  });

  describe('loadProject', () => {
    it('returns null for non-existent project', async () => {
      const result = await repository.loadProject('user-1', 'non-existent');

      expect(result).toBeNull();
    });

    it('returns null if user does not own project', async () => {
      const project = Project.create('user-1', 'Test', []);
      await repository.createProject('user-1', project);

      const result = await repository.loadProject('user-2', project.getId());

      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('returns only projects owned by user', async () => {
      const project1 = Project.create('user-1', 'Project 1', []);
      const project2 = Project.create('user-1', 'Project 2', []);
      const project3 = Project.create('user-2', 'Other User', []);

      await repository.createProject('user-1', project1);
      await repository.createProject('user-1', project2);
      await repository.createProject('user-2', project3);

      const user1Projects = await repository.listProjects('user-1');
      const user2Projects = await repository.listProjects('user-2');

      expect(user1Projects).toHaveLength(2);
      expect(user2Projects).toHaveLength(1);
    });

    it('returns empty array for user with no projects', async () => {
      const result = await repository.listProjects('user-1');

      expect(result).toEqual([]);
    });

    it('sorts by updatedAt descending', async () => {
      const project1 = Project.create('user-1', 'Older', []);
      await repository.createProject('user-1', project1);

      // Ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));

      const project2 = Project.create('user-1', 'Newer', []);
      await repository.createProject('user-1', project2);

      const projects = await repository.listProjects('user-1');

      expect(projects[0].getTitle()).toBe('Newer');
      expect(projects[1].getTitle()).toBe('Older');
    });
  });

  describe('updateProject', () => {
    it('updates existing project', async () => {
      const project = Project.create('user-1', 'Original', []);
      await repository.createProject('user-1', project);

      project.updateTitle('Updated');
      await repository.updateProject('user-1', project);

      const loaded = await repository.loadProject('user-1', project.getId());
      expect(loaded?.getTitle()).toBe('Updated');
    });

    it('throws if project not found', async () => {
      const project = Project.create('user-1', 'Test', []);

      await expect(
        repository.updateProject('user-1', project)
      ).rejects.toThrow('not found');
    });

    it('throws if user does not own project', async () => {
      const project = Project.create('user-1', 'Test', []);
      await repository.createProject('user-1', project);

      await expect(
        repository.updateProject('user-2', project)
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('deleteProject', () => {
    it('removes project', async () => {
      const project = Project.create('user-1', 'Test', []);
      await repository.createProject('user-1', project);

      await repository.deleteProject('user-1', project.getId());

      const loaded = await repository.loadProject('user-1', project.getId());
      expect(loaded).toBeNull();
    });

    it('throws if user does not own project', async () => {
      const project = Project.create('user-1', 'Test', []);
      await repository.createProject('user-1', project);

      await expect(
        repository.deleteProject('user-2', project.getId())
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('updateChapter', () => {
    it('updates chapter and touches project', async () => {
      const chapter = new Chapter('ch-1', 'Chapter 1', JSON.stringify({ type: 'doc', content: [] }), 0);
      const project = Project.create('user-1', 'Test', [chapter]);
      await repository.createProject('user-1', project);
      const initialUpdatedAt = project.getUpdatedAt();

      await new Promise((r) => setTimeout(r, 10));
      chapter.updateContent(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'new content' }] }] }));
      await repository.updateChapter('user-1', project.getId(), chapter);

      const loaded = await repository.loadProject('user-1', project.getId());
      expect(loaded?.getUpdatedAt().getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });
});
