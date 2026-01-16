// ABOUTME: Test suite for CreateProjectUseCase validating project creation logic
// ABOUTME: Tests that AI provider is optional for project creation

import { describe, it, expect, vi } from 'vitest';
import { CreateProjectUseCase, InvalidProviderError } from './CreateProjectUseCase';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { Provider } from '@/domain/entities/Provider';
import { Project } from '@/domain/entities/Project';

describe('CreateProjectUseCase', () => {
  const createMockProjectRepository = (): ProjectRepository => ({
    createProject: vi.fn().mockResolvedValue(undefined),
    loadProject: vi.fn(),
    listProjects: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    updateChapter: vi.fn(),
    deleteAllByOwner: vi.fn(),
  });

  const createMockProviderRepository = (): ProviderRepository => ({
    create: vi.fn(),
    findById: vi.fn(),
    listProviders: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    delete: vi.fn(),
    isUsedByProjects: vi.fn(),
    deleteAllByOwner: vi.fn(),
  });

  const createValidProvider = (id: string): Provider => {
    return new Provider(
      id,
      'owner-123',
      'Test Provider',
      'openai',
      'gpt-4o-mini',
      'encrypted-key',
      true // isValid
    );
  };

  const createInvalidProvider = (id: string): Provider => {
    return new Provider(
      id,
      'owner-123',
      'Invalid Provider',
      'openai',
      'gpt-4o-mini',
      'encrypted-key',
      false // isValid
    );
  };

  describe('project creation without provider (AI is optional)', () => {
    it('should create project without any providers configured', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      const result = await useCase.execute({
        ownerId: 'owner-123',
        title: 'Mon Roman',
      });

      expect(result).toBeInstanceOf(Project);
      expect(result.getTitle()).toBe('Mon Roman');
      expect(result.getProviderId()).toBeNull();
      expect(projectRepo.createProject).toHaveBeenCalledWith('owner-123', result);
    });

    it('should create project with default title when not provided', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      const result = await useCase.execute({
        ownerId: 'owner-123',
      });

      expect(result.getTitle()).toBe('Nouveau projet');
    });

    it('should create project without provider even when user has providers', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      providerRepo.listProviders = vi.fn().mockResolvedValue([
        createValidProvider('provider-1'),
      ]);
      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      const result = await useCase.execute({
        ownerId: 'owner-123',
        title: 'Project Without Provider',
      });

      expect(result.getProviderId()).toBeNull();
    });
  });

  describe('project creation with provider', () => {
    it('should create project with valid provider', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      const validProvider = createValidProvider('provider-123');
      providerRepo.findById = vi.fn().mockResolvedValue(validProvider);

      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      const result = await useCase.execute({
        ownerId: 'owner-123',
        title: 'Project With Provider',
        providerId: 'provider-123',
      });

      expect(result.getProviderId()).toBe('provider-123');
    });

    it('should throw InvalidProviderError when provider not found', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      providerRepo.findById = vi.fn().mockResolvedValue(null);

      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      await expect(
        useCase.execute({
          ownerId: 'owner-123',
          title: 'Test',
          providerId: 'non-existent-provider',
        })
      ).rejects.toThrow(InvalidProviderError);
    });

    it('should throw InvalidProviderError when provider is not valid', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      const invalidProvider = createInvalidProvider('provider-456');
      providerRepo.findById = vi.fn().mockResolvedValue(invalidProvider);

      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      await expect(
        useCase.execute({
          ownerId: 'owner-123',
          title: 'Test',
          providerId: 'provider-456',
        })
      ).rejects.toThrow(InvalidProviderError);
    });
  });

  describe('persistence', () => {
    it('should persist project to repository', async () => {
      const projectRepo = createMockProjectRepository();
      const providerRepo = createMockProviderRepository();
      const useCase = new CreateProjectUseCase(projectRepo, providerRepo);

      const result = await useCase.execute({
        ownerId: 'owner-123',
        title: 'Test Project',
      });

      expect(projectRepo.createProject).toHaveBeenCalledTimes(1);
      expect(projectRepo.createProject).toHaveBeenCalledWith('owner-123', result);
    });
  });
});
