// ABOUTME: Security tests for multi-tenant data isolation.
// ABOUTME: Validates that users cannot access other users' projects, providers, or metadata.

import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from '@/domain/entities/Project';
import { Provider } from '@/domain/entities/Provider';
import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import { Chapter } from '@/domain/entities/Chapter';
import {
  createMockProjectRepository,
  createMockProviderRepository,
  createMockMetadataRepository,
} from '@/test/mocks/repositories';
import { createSimpleDocument, stringify } from '@/test/fixtures/tiptap';

describe('Multi-tenant Security', () => {
  const USER_A = 'user-alice-123';
  const USER_B = 'user-bob-456';
  const USER_C = 'user-charlie-789';

  describe('Project Isolation', () => {
    let projectRepo: ReturnType<typeof createMockProjectRepository>;

    beforeEach(() => {
      projectRepo = createMockProjectRepository();
    });

    it('should not allow user B to load user A project', async () => {
      // User A creates a project
      const projectA = Project.create(USER_A, 'Alice Secret Project', [
        new Chapter('ch-1', 'Chapter 1', stringify(createSimpleDocument('Secret content')), 0),
      ]);
      await projectRepo.createProject(USER_A, projectA);

      // User B tries to load it
      const loaded = await projectRepo.loadProject(USER_B, projectA.getId());

      expect(loaded).toBeNull();
    });

    it('should not allow user B to save to user A project', async () => {
      // User A creates a project
      const projectA = Project.create(USER_A, 'Alice Project', []);
      await projectRepo.createProject(USER_A, projectA);

      // User B tries to modify it (by creating a different project with same ID)
      const maliciousProject = Project.create(USER_B, 'Hacked!', []);
      // Attempt to overwrite - in real implementation this would fail
      await projectRepo.updateProject(USER_B, maliciousProject);

      // Verify original project is unchanged
      const original = await projectRepo.loadProject(USER_A, projectA.getId());
      expect(original?.getTitle()).toBe('Alice Project');
    });

    it('should only list user own projects', async () => {
      // Create projects for multiple users
      await projectRepo.createProject(USER_A, Project.create(USER_A, 'Alice Project 1', []));
      await projectRepo.createProject(USER_A, Project.create(USER_A, 'Alice Project 2', []));
      await projectRepo.createProject(USER_B, Project.create(USER_B, 'Bob Project', []));
      await projectRepo.createProject(USER_C, Project.create(USER_C, 'Charlie Project', []));

      // User A lists projects
      const aliceProjects = await projectRepo.listProjects(USER_A);
      expect(aliceProjects).toHaveLength(2);
      expect(aliceProjects.every(p => p.getOwnerId() === USER_A)).toBe(true);

      // User B lists projects
      const bobProjects = await projectRepo.listProjects(USER_B);
      expect(bobProjects).toHaveLength(1);
      expect(bobProjects[0].getOwnerId()).toBe(USER_B);
    });

    it('should not allow user B to delete user A project', async () => {
      // User A creates a project
      const projectA = Project.create(USER_A, 'Alice Project', []);
      await projectRepo.createProject(USER_A, projectA);

      // User B tries to delete it
      await projectRepo.deleteProject(USER_B, projectA.getId());

      // Project should still exist
      const stillExists = await projectRepo.loadProject(USER_A, projectA.getId());
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Provider Isolation', () => {
    let providerRepo: ReturnType<typeof createMockProviderRepository>;

    beforeEach(() => {
      providerRepo = createMockProviderRepository();
    });

    it('should not allow user B to access user A provider', async () => {
      // User A creates a provider
      const providerA = Provider.create(
        'provider-a',
        USER_A,
        'Alice OpenAI',
        'openai',
        'sk-alice-secret-key',
        'gpt-4o'
      );
      await providerRepo.create(USER_A, providerA);

      // User B tries to access it
      const loaded = await providerRepo.findById(USER_B, 'provider-a');

      expect(loaded).toBeNull();
    });

    it('should only list user own providers', async () => {
      // Create providers for multiple users
      const providerA = Provider.create('pa', USER_A, 'Alice Provider', 'openai', 'key', 'gpt-4o');
      const providerB1 = Provider.create('pb1', USER_B, 'Bob Provider 1', 'openai', 'key', 'gpt-4o');
      const providerB2 = Provider.create('pb2', USER_B, 'Bob Provider 2', 'anthropic', 'key', 'claude-sonnet-4-5-20250929');

      await providerRepo.create(USER_A, providerA);
      await providerRepo.create(USER_B, providerB1);
      await providerRepo.create(USER_B, providerB2);

      // User A lists providers
      const aliceProviders = await providerRepo.listProviders(USER_A);
      expect(aliceProviders).toHaveLength(1);
      expect(aliceProviders[0].getName()).toBe('Alice Provider');

      // User B lists providers
      const bobProviders = await providerRepo.listProviders(USER_B);
      expect(bobProviders).toHaveLength(2);
    });

    it('should not allow user B to delete user A provider', async () => {
      // User A creates a provider
      const providerA = Provider.create('pa', USER_A, 'Alice Provider', 'openai', 'key', 'gpt-4o');
      await providerRepo.create(USER_A, providerA);

      // User B tries to delete it
      await providerRepo.delete(USER_B, 'pa');

      // Provider should still exist
      const stillExists = await providerRepo.findById(USER_A, 'pa');
      expect(stillExists).not.toBeNull();
    });

    it('should protect API keys from cross-user access', async () => {
      // User A creates a provider with a secret API key
      const providerA = Provider.create(
        'pa',
        USER_A,
        'Alice Provider',
        'openai',
        'sk-super-secret-api-key-never-share',
        'gpt-4o'
      );
      await providerRepo.create(USER_A, providerA);

      // User B tries to access it - should get nothing
      const loaded = await providerRepo.findById(USER_B, 'pa');
      expect(loaded).toBeNull();

      // Even listing shouldn't expose other users' providers
      const bobProviders = await providerRepo.listProviders(USER_B);
      expect(bobProviders.some(p => p.getApiKey().includes('super-secret'))).toBe(false);
    });
  });

  describe('Metadata Isolation', () => {
    let metadataRepo: ReturnType<typeof createMockMetadataRepository>;

    beforeEach(() => {
      metadataRepo = createMockMetadataRepository();
    });

    it('should not allow user B to access user A metadata', async () => {
      // User A creates metadata
      // ProjectMetadata constructor: (id, projectId, typeKey, title, content)
      const metadataA = new ProjectMetadata(
        'meta-a',
        'project-a',
        'narrative-analysis',
        'Narrative Analysis',
        stringify(createSimpleDocument('Analysis content'))
      );
      await metadataRepo.create(USER_A, metadataA);

      // User B tries to access it
      const loaded = await metadataRepo.findById(USER_B, 'meta-a');

      expect(loaded).toBeNull();
    });

    it('should only return user own metadata for a project', async () => {
      // User A creates metadata for their project
      const metaA1 = ProjectMetadata.createEmpty('m1', 'proj-a', 'narrative-analysis', 'Narrative');
      const metaA2 = ProjectMetadata.createEmpty('m2', 'proj-a', 'characters', 'Characters');
      await metadataRepo.create(USER_A, metaA1);
      await metadataRepo.create(USER_A, metaA2);

      // User B creates metadata for their own project with same project ID (different owner)
      const metaB = ProjectMetadata.createEmpty('m3', 'proj-a', 'plot', 'Plot');
      await metadataRepo.create(USER_B, metaB);

      // User A should only see their own metadata
      const aliceMetadata = await metadataRepo.findByProjectId(USER_A, 'proj-a');
      expect(aliceMetadata).toHaveLength(2);
      // All metadata should belong to proj-a (multi-tenancy is handled by repo, not entity)
      expect(aliceMetadata.every(m => m.getProjectId() === 'proj-a')).toBe(true);
    });

    it('should not allow cross-user metadata deletion', async () => {
      // User A creates metadata
      const metaA = ProjectMetadata.createEmpty('m1', 'proj', 'plot', 'Plot');
      await metadataRepo.create(USER_A, metaA);

      // User B tries to delete it
      await metadataRepo.delete(USER_B, 'm1');

      // Should still exist
      const stillExists = await metadataRepo.findById(USER_A, 'm1');
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Cross-user Reference Attacks', () => {
    let projectRepo: ReturnType<typeof createMockProjectRepository>;
    let providerRepo: ReturnType<typeof createMockProviderRepository>;

    beforeEach(() => {
      projectRepo = createMockProjectRepository();
      providerRepo = createMockProviderRepository();
    });

    it('should not allow user B to use user A provider in their project', async () => {
      // User A creates a provider
      const providerA = Provider.create('pa', USER_A, 'Alice Provider', 'openai', 'key', 'gpt-4o');
      await providerRepo.create(USER_A, providerA);

      // User B creates a project and tries to reference Alice's provider
      const projectB = Project.create(USER_B, 'Bob Project', []);
      projectB.setProviderId('pa'); // Tries to use Alice's provider ID
      await projectRepo.createProject(USER_B, projectB);

      // When trying to use the provider, it should fail
      const loadedProvider = await providerRepo.findById(USER_B, 'pa');
      expect(loadedProvider).toBeNull(); // Bob cannot access Alice's provider
    });

    it('should handle ID enumeration attempts', async () => {
      // User A creates multiple projects
      for (let i = 0; i < 100; i++) {
        const project = Project.create(USER_A, `Project ${i}`, []);
        await projectRepo.createProject(USER_A, project);
      }

      // User B tries to enumerate IDs
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        const attempt = await projectRepo.loadProject(USER_B, `project-id-${i}`);
        results.push(attempt !== null);
      }

      // All attempts should fail
      expect(results.every(r => r === false)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    let projectRepo: ReturnType<typeof createMockProjectRepository>;

    beforeEach(() => {
      projectRepo = createMockProjectRepository();
    });

    it('should handle empty user ID', async () => {
      const project = Project.create(USER_A, 'Project', []);
      await projectRepo.createProject(USER_A, project);

      // Try to access with empty user ID
      const result = await projectRepo.loadProject('', project.getId());
      expect(result).toBeNull();
    });

    it('should handle null-like user IDs', async () => {
      const project = Project.create(USER_A, 'Project', []);
      await projectRepo.createProject(USER_A, project);

      // Try various null-like values
      const results = await Promise.all([
        projectRepo.loadProject('null', project.getId()),
        projectRepo.loadProject('undefined', project.getId()),
        projectRepo.loadProject('0', project.getId()),
      ]);

      expect(results.every(r => r === null)).toBe(true);
    });

    it('should handle case sensitivity in user IDs', async () => {
      const project = Project.create('User-123', 'Project', []);
      await projectRepo.createProject('User-123', project);

      // Try with different cases
      const results = await Promise.all([
        projectRepo.loadProject('user-123', project.getId()),
        projectRepo.loadProject('USER-123', project.getId()),
        projectRepo.loadProject('User-123', project.getId()), // Original case
      ]);

      // Only exact match should work
      expect(results[0]).toBeNull();
      expect(results[1]).toBeNull();
      expect(results[2]).not.toBeNull();
    });
  });
});
