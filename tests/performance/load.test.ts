// ABOUTME: Load and stress tests for application performance.
// ABOUTME: Validates behavior under concurrent operations and high load.

import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import {
  createMockProjectRepository,
  createMockProviderRepository,
} from '@/test/mocks/repositories';
import { createSimpleDocument, createFictionChapter, stringify } from '@/test/fixtures/tiptap';
import { createTestProject, createLargeProject } from '@/test/fixtures/projects';

describe('Load Testing', () => {
  describe('Concurrent Operations', () => {
    let projectRepo: ReturnType<typeof createMockProjectRepository>;

    beforeEach(() => {
      projectRepo = createMockProjectRepository();
    });

    it('should handle 50 concurrent project creations', async () => {
      const userId = 'user-123';
      const createPromises = Array(50).fill(null).map((_, i) =>
        (async () => {
          const project = Project.create(userId, `Project ${i}`, []);
          await projectRepo.createProject(userId, project);
          return project.getId();
        })()
      );

      const results = await Promise.allSettled(createPromises);
      const succeeded = results.filter(r => r.status === 'fulfilled');

      expect(succeeded.length).toBe(50);
    });

    it('should handle 100 concurrent project loads', async () => {
      const userId = 'user-123';

      // Create 10 projects first
      const projects: Project[] = [];
      for (let i = 0; i < 10; i++) {
        const project = Project.create(userId, `Project ${i}`, []);
        await projectRepo.createProject(userId, project);
        projects.push(project);
      }

      // Load them 100 times concurrently
      const loadPromises = Array(100).fill(null).map((_, i) =>
        projectRepo.loadProject(userId, projects[i % 10].getId())
      );

      const results = await Promise.allSettled(loadPromises);
      const succeeded = results.filter(r => r.status === 'fulfilled' && r.value !== null);

      expect(succeeded.length).toBe(100);
    });

    it('should handle concurrent reads and writes', async () => {
      const userId = 'user-123';
      const project = Project.create(userId, 'Concurrent Project', [
        new Chapter('ch-1', 'Chapter 1', stringify(createSimpleDocument('Initial')), 0),
      ]);
      await projectRepo.createProject(userId, project);

      // Mix of reads and writes
      const operations = Array(50).fill(null).map((_, i) => {
        if (i % 2 === 0) {
          // Read
          return projectRepo.loadProject(userId, project.getId());
        } else {
          // Write
          project.updateTitle(`Title ${i}`);
          return projectRepo.updateProject(userId, project);
        }
      });

      const results = await Promise.allSettled(operations);
      const failed = results.filter(r => r.status === 'rejected');

      expect(failed.length).toBe(0);
    });

    it('should handle 20 users creating projects simultaneously', async () => {
      const createPromises = Array(20).fill(null).map((_, i) => {
        const userId = `user-${i}`;
        const project = Project.create(userId, `User ${i} Project`, []);
        return projectRepo.createProject(userId, project);
      });

      const results = await Promise.allSettled(createPromises);
      const succeeded = results.filter(r => r.status === 'fulfilled');

      expect(succeeded.length).toBe(20);
    });
  });

  describe('Large Data Handling', () => {
    let projectRepo: ReturnType<typeof createMockProjectRepository>;

    beforeEach(() => {
      projectRepo = createMockProjectRepository();
    });

    it('should handle project with 50 chapters', async () => {
      const userId = 'user-123';
      const chapters = Array.from({ length: 50 }, (_, i) =>
        new Chapter(
          `ch-${i}`,
          `Chapter ${i + 1}`,
          stringify(createSimpleDocument(`Content for chapter ${i + 1}`)),
          i
        )
      );

      const project = Project.create(userId, 'Large Project', chapters);

      const startSave = performance.now();
      await projectRepo.createProject(userId, project);
      const saveDuration = performance.now() - startSave;

      const startLoad = performance.now();
      const loaded = await projectRepo.loadProject(userId, project.getId());
      const loadDuration = performance.now() - startLoad;

      expect(loaded).not.toBeNull();
      expect(loaded?.getChapters()).toHaveLength(50);

      // Should be fast (< 100ms for in-memory)
      expect(saveDuration).toBeLessThan(100);
      expect(loadDuration).toBeLessThan(100);
    });

    it('should handle chapter with 10000 words', async () => {
      const userId = 'user-123';
      const largeContent = stringify(createFictionChapter('Large Chapter', 10000));

      const chapter = new Chapter('ch-1', 'Large Chapter', largeContent, 0);
      const project = Project.create(userId, 'Project', [chapter]);

      await projectRepo.createProject(userId, project);
      const loaded = await projectRepo.loadProject(userId, project.getId());

      expect(loaded).not.toBeNull();
      expect(loaded?.getChapters()[0].getContent().length).toBeGreaterThan(10000);
    });

    it('should handle listing 100 projects', async () => {
      const userId = 'user-123';

      // Create 100 projects
      for (let i = 0; i < 100; i++) {
        const project = Project.create(userId, `Project ${i}`, []);
        await projectRepo.createProject(userId, project);
      }

      const startList = performance.now();
      const projects = await projectRepo.listProjects(userId);
      const listDuration = performance.now() - startList;

      expect(projects).toHaveLength(100);
      expect(listDuration).toBeLessThan(100); // Should be fast
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory when creating many projects', async () => {
      const projectRepo = createMockProjectRepository();
      const userId = 'user-123';

      // Create and immediately delete many projects
      for (let i = 0; i < 100; i++) {
        const project = Project.create(userId, `Project ${i}`, []);
        await projectRepo.createProject(userId, project);
        await projectRepo.deleteProject(userId, project.getId());
      }

      // Internal storage should be clean
      const remaining = await projectRepo.listProjects(userId);
      expect(remaining).toHaveLength(0);
    });

    it('should efficiently handle chapter content updates', async () => {
      const projectRepo = createMockProjectRepository();
      const userId = 'user-123';

      const project = Project.create(userId, 'Project', [
        new Chapter('ch-1', 'Chapter', stringify(createSimpleDocument('Initial')), 0),
      ]);
      await projectRepo.createProject(userId, project);

      // Simulate many content updates (like typing)
      for (let i = 0; i < 100; i++) {
        const chapter = project.getChapters()[0];
        chapter.updateContent(stringify(createSimpleDocument(`Content version ${i}`)));
        await projectRepo.updateProject(userId, project);
      }

      const loaded = await projectRepo.loadProject(userId, project.getId());
      expect(loaded?.getChapters()[0].getContent()).toContain('version 99');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should create project in < 10ms', async () => {
      const projectRepo = createMockProjectRepository();
      const userId = 'user-123';

      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const project = Project.create(userId, `Project ${i}`, []);
        const start = performance.now();
        await projectRepo.createProject(userId, project);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(10);
    });

    it('should load project in < 5ms', async () => {
      const projectRepo = createMockProjectRepository();
      const userId = 'user-123';

      const project = Project.create(userId, 'Project', []);
      await projectRepo.createProject(userId, project);

      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await projectRepo.loadProject(userId, project.getId());
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(5);
    });

    it('should switch chapters in < 1ms', () => {
      const project = createTestProject({
        chapters: [
          new Chapter('ch-1', 'Chapter 1', stringify(createSimpleDocument('Content 1')), 0),
          new Chapter('ch-2', 'Chapter 2', stringify(createSimpleDocument('Content 2')), 1),
          new Chapter('ch-3', 'Chapter 3', stringify(createSimpleDocument('Content 3')), 2),
        ],
      });

      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const targetChapter = `ch-${(i % 3) + 1}`;
        const start = performance.now();
        project.setActiveChapter(targetChapter);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(1);
    });

    it('should update chapter content in < 1ms', () => {
      const chapter = new Chapter('ch-1', 'Chapter', stringify(createSimpleDocument('Initial')), 0);

      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const newContent = stringify(createSimpleDocument(`Content ${i}`));
        const start = performance.now();
        chapter.updateContent(newContent);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Rate Limiting Behavior', () => {
    it('should handle burst of requests gracefully', async () => {
      const providerRepo = createMockProviderRepository();
      const userId = 'user-123';

      // Simulate burst of provider listing requests
      const burstPromises = Array(100).fill(null).map(() =>
        providerRepo.listProviders(userId)
      );

      const results = await Promise.allSettled(burstPromises);
      const succeeded = results.filter(r => r.status === 'fulfilled');

      expect(succeeded.length).toBe(100);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain consistency under parallel operations', async () => {
      const projectRepo = createMockProjectRepository();
      const userId = 'user-123';

      const project = Project.create(userId, 'Stress Test', [
        new Chapter('ch-1', 'Chapter', stringify(createSimpleDocument('Initial')), 0),
      ]);
      await projectRepo.createProject(userId, project);

      // Parallel reads and writes
      const operations = [];

      // 50 reads
      for (let i = 0; i < 50; i++) {
        operations.push(projectRepo.loadProject(userId, project.getId()));
      }

      // 50 writes with different titles
      for (let i = 0; i < 50; i++) {
        const updatedProject = Project.create(userId, `Title ${i}`, project.getChapters());
        // Copy the ID
        Object.defineProperty(updatedProject, 'id', { value: project.getId() });
        operations.push(projectRepo.updateProject(userId, updatedProject));
      }

      // Shuffle operations
      const shuffled = operations.sort(() => Math.random() - 0.5);

      const results = await Promise.allSettled(shuffled);
      const failed = results.filter(r => r.status === 'rejected');

      expect(failed.length).toBe(0);
    });
  });
});
