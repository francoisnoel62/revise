// ABOUTME: Mock repository implementations for unit testing.
// ABOUTME: Provides in-memory implementations of repository interfaces.

import { vi } from 'vitest';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { Provider } from '@/domain/entities/Provider';
import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';

/**
 * Create a mock ProjectRepository.
 */
export function createMockProjectRepository(): ProjectRepository & {
  _projects: Map<string, Project>;
  _reset: () => void;
} {
  const projects = new Map<string, Project>();

  return {
    _projects: projects,
    _reset: () => projects.clear(),

    createProject: vi.fn(async (_ownerId: string, project: Project) => {
      projects.set(project.getId(), project);
      return project;
    }),

    loadProject: vi.fn(async (ownerId: string, projectId: string) => {
      const project = projects.get(projectId);
      if (project && project.getOwnerId() === ownerId) {
        return project;
      }
      return null;
    }),

    updateProject: vi.fn(async (_ownerId: string, project: Project) => {
      projects.set(project.getId(), project);
      return project;
    }),

    listProjects: vi.fn(async (ownerId: string) => {
      return Array.from(projects.values()).filter(p => p.getOwnerId() === ownerId);
    }),

    deleteProject: vi.fn(async (ownerId: string, projectId: string) => {
      const project = projects.get(projectId);
      if (project && project.getOwnerId() === ownerId) {
        projects.delete(projectId);
      }
    }),

    updateChapter: vi.fn(async (_ownerId: string, _projectId: string, _chapter: Chapter) => {
      // No-op for mock
    }),
  };
}

/**
 * Create a mock ProviderRepository.
 */
export function createMockProviderRepository(): ProviderRepository & {
  _providers: Map<string, Provider>;
  _reset: () => void;
} {
  const providers = new Map<string, Provider>();

  return {
    _providers: providers,
    _reset: () => providers.clear(),

    create: vi.fn(async (_userId: string, provider: Provider) => {
      providers.set(provider.getId(), provider);
      return provider;
    }),

    update: vi.fn(async (_userId: string, provider: Provider) => {
      providers.set(provider.getId(), provider);
      return provider;
    }),

    findById: vi.fn(async (ownerId: string, providerId: string) => {
      const provider = providers.get(providerId);
      if (provider && provider.getOwnerId() === ownerId) {
        return provider;
      }
      return null;
    }),

    listProviders: vi.fn(async (ownerId: string) => {
      return Array.from(providers.values()).filter(p => p.getOwnerId() === ownerId);
    }),

    delete: vi.fn(async (ownerId: string, providerId: string) => {
      const provider = providers.get(providerId);
      if (provider && provider.getOwnerId() === ownerId) {
        providers.delete(providerId);
      }
    }),

    isUsedByProjects: vi.fn(async () => false),
  };
}

/**
 * Create a mock MetadataRepository.
 * Stores ownerId separately since ProjectMetadata entity doesn't have an ownerId field.
 */
export function createMockMetadataRepository(): MetadataRepository & {
  _metadata: Map<string, { data: ProjectMetadata; ownerId: string }>;
  _reset: () => void;
} {
  const metadata = new Map<string, { data: ProjectMetadata; ownerId: string }>();

  return {
    _metadata: metadata,
    _reset: () => metadata.clear(),

    create: vi.fn(async (ownerId: string, data: ProjectMetadata) => {
      metadata.set(data.getId(), { data, ownerId });
      return data;
    }),

    findById: vi.fn(async (ownerId: string, metadataId: string) => {
      const entry = metadata.get(metadataId);
      if (entry && entry.ownerId === ownerId) {
        return entry.data;
      }
      return null;
    }),

    findByProjectId: vi.fn(async (ownerId: string, projectId: string) => {
      return Array.from(metadata.values())
        .filter(entry => entry.ownerId === ownerId && entry.data.getProjectId() === projectId)
        .map(entry => entry.data);
    }),

    findByProjectAndType: vi.fn(async (ownerId: string, projectId: string, typeKey: string) => {
      for (const entry of metadata.values()) {
        if (entry.ownerId === ownerId &&
            entry.data.getProjectId() === projectId &&
            entry.data.getTypeKey() === typeKey) {
          return entry.data;
        }
      }
      return null;
    }),

    update: vi.fn(async (ownerId: string, data: ProjectMetadata) => {
      const entry = metadata.get(data.getId());
      if (entry && entry.ownerId === ownerId) {
        metadata.set(data.getId(), { data, ownerId });
      }
      return data;
    }),

    delete: vi.fn(async (ownerId: string, metadataId: string) => {
      const entry = metadata.get(metadataId);
      if (entry && entry.ownerId === ownerId) {
        metadata.delete(metadataId);
      }
    }),

    deleteByProjectId: vi.fn(async (ownerId: string, projectId: string) => {
      for (const [id, entry] of metadata.entries()) {
        if (entry.ownerId === ownerId && entry.data.getProjectId() === projectId) {
          metadata.delete(id);
        }
      }
    }),
  };
}

/**
 * Create mock LLMProvider for testing AI operations.
 */
export function createMockLLMProvider() {
  return {
    generateRewrites: vi.fn(),
    testConnection: vi.fn().mockResolvedValue({ valid: true }),
    getProviderName: vi.fn().mockReturnValue('mock'),
    getModel: vi.fn().mockReturnValue('mock-model'),
    generateNarrativeAnalysis: vi.fn(),
    generateCharacters: vi.fn(),
    generatePlot: vi.fn(),
    generateStylisticDNA: vi.fn(),
    generateWorldbuilding: vi.fn(),
    generateSynthesis: vi.fn(),
  };
}

/**
 * Create mock LLMProviderFactory for testing.
 */
export function createMockLLMProviderFactory() {
  const mockProvider = createMockLLMProvider();

  return {
    create: vi.fn().mockReturnValue(mockProvider),
    _mockProvider: mockProvider,
  };
}

/**
 * Create mock ID generator.
 */
export function createMockIdGenerator() {
  let counter = 0;
  return {
    generate: vi.fn(() => `mock-id-${++counter}`),
    _reset: () => { counter = 0; },
  };
}

/**
 * Create mock auth utilities for server action tests.
 */
export function createMockAuthUtils(userId = 'test-user-123') {
  return {
    getAuthenticatedUserId: vi.fn().mockResolvedValue({ userId }),
    setUnauthenticated: () => {
      return vi.fn().mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });
    },
  };
}
