// ABOUTME: Tests for project Server Actions.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProjectAction,
  loadProjectAction,
  listProjectsAction,
  deleteProjectAction,
} from './project-actions';

// Mock the utils module
vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getIdGenerator: vi.fn(),
  getRepository: vi.fn(),
  getProviderRepo: vi.fn(),
  getMetadataRepo: vi.fn(),
  getProjectSettingsRepo: vi.fn(),
  getSnapshotRepo: vi.fn(),
  getWritingGoalRepo: vi.fn(),
  withErrorHandling: vi.fn(async (fn) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

import { getAuthenticatedUserId, getIdGenerator, getRepository, getProviderRepo, getMetadataRepo, getProjectSettingsRepo, getSnapshotRepo, getWritingGoalRepo } from './utils';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';
import { Project } from '@/domain/entities/Project';
import { Provider } from '@/domain/entities/Provider';

describe('project-actions', () => {
  let mockRepository: InMemoryProjectRepository;
  let mockProviderRepository: {
    listProviders: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let mockMetadataRepository: {
    deleteByProjectId: ReturnType<typeof vi.fn>;
  };
  let mockProjectSettingsRepository: {
    deleteByProjectId: ReturnType<typeof vi.fn>;
    findByProjectId: ReturnType<typeof vi.fn>;
  };
  let mockSnapshotRepository: {
    deleteByProjectId: ReturnType<typeof vi.fn>;
  };
  let mockWritingGoalRepository: {
    findActiveByProjectId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIdGenerator).mockResolvedValue({ generate: () => globalThis.crypto.randomUUID() });
    mockRepository = new InMemoryProjectRepository();
    vi.mocked(getRepository).mockResolvedValue(mockRepository);

    // Create a valid provider for tests
    const validProvider = Provider.create(
      'provider-123',
      'user-123',
      'Test Provider',
      'openai',
      'sk-test-key',
      'gpt-4o'
    );
    validProvider.markAsValid();

    // Mock provider repository
    mockProviderRepository = {
      listProviders: vi.fn().mockResolvedValue([validProvider]),
      findById: vi.fn().mockResolvedValue(validProvider),
    };
    vi.mocked(getProviderRepo).mockResolvedValue(mockProviderRepository as never);

    // Mock metadata repository
    mockMetadataRepository = {
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getMetadataRepo).mockResolvedValue(mockMetadataRepository as never);

    // Mock project settings repository
    mockProjectSettingsRepository = {
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
      findByProjectId: vi.fn().mockResolvedValue(null),
    };
    vi.mocked(getProjectSettingsRepo).mockResolvedValue(mockProjectSettingsRepository as never);

    mockSnapshotRepository = {
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getSnapshotRepo).mockResolvedValue(mockSnapshotRepository as never);

    // Mock writing goal repository
    mockWritingGoalRepository = {
      findActiveByProjectId: vi.fn().mockResolvedValue(null),
    };
    vi.mocked(getWritingGoalRepo).mockResolvedValue(mockWritingGoalRepository as never);
  });

  describe('createProjectAction', () => {
    it('creates project for authenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const result = await createProjectAction('My Project');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Project');
        expect(result.data.chapters).toHaveLength(1);
      }
    });

    it('returns error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await createProjectAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.redirect).toBe('/auth/signin');
      }
    });
  });

  describe('loadProjectAction', () => {
    it('loads project owned by user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const project = Project.create('user-123', 'Test', []);
      await mockRepository.createProject('user-123', project);

      const result = await loadProjectAction(project.getId());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test');
      }
    });

    it('returns error for non-existent project', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const result = await loadProjectAction('non-existent');

      expect(result.success).toBe(false);
    });
  });

  describe('listProjectsAction', () => {
    it('returns only user projects', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const project1 = Project.create('user-123', 'Project 1', []);
      const project2 = Project.create('user-456', 'Other User', []);
      await mockRepository.createProject('user-123', project1);
      await mockRepository.createProject('user-456', project2);

      const result = await listProjectsAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe('Project 1');
      }
    });
  });

  describe('deleteProjectAction', () => {
    it('deletes project owned by user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const project = Project.create('user-123', 'Test', []);
      await mockRepository.createProject('user-123', project);

      const result = await deleteProjectAction(project.getId());

      expect(result.success).toBe(true);

      const loaded = await mockRepository.loadProject('user-123', project.getId());
      expect(loaded).toBeNull();

      // Deleting a project is the final lifecycle boundary: the restorable snapshots must go
      // with it, scoped to the owner so one tenant's delete can never reach another's.
      expect(mockSnapshotRepository.deleteByProjectId).toHaveBeenCalledWith(
        'user-123',
        project.getId(),
      );
    });
  });
});
