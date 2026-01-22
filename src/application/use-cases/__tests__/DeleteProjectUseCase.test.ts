// ABOUTME: Tests for DeleteProjectUseCase
// ABOUTME: Verifies cascade deletion of project settings

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteProjectUseCase } from '../DeleteProjectUseCase';

describe('DeleteProjectUseCase', () => {
  let mockProjectRepository: any;
  let mockMetadataRepository: any;
  let mockProjectSettingsRepository: any;

  beforeEach(() => {
    mockProjectRepository = {
      deleteProject: vi.fn().mockResolvedValue(undefined),
    };

    mockMetadataRepository = {
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
    };

    mockProjectSettingsRepository = {
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should delete project', async () => {
    const useCase = new DeleteProjectUseCase(mockProjectRepository);

    await useCase.execute({ ownerId: 'owner-1', projectId: 'project-1' });

    expect(mockProjectRepository.deleteProject).toHaveBeenCalledWith('owner-1', 'project-1');
  });

  it('should delete metadata when repository is provided', async () => {
    const useCase = new DeleteProjectUseCase(
      mockProjectRepository,
      mockMetadataRepository
    );

    await useCase.execute({ ownerId: 'owner-1', projectId: 'project-1' });

    expect(mockMetadataRepository.deleteByProjectId).toHaveBeenCalledWith('owner-1', 'project-1');
    expect(mockProjectRepository.deleteProject).toHaveBeenCalledWith('owner-1', 'project-1');
  });

  it('should delete project settings when repository is provided', async () => {
    const useCase = new DeleteProjectUseCase(
      mockProjectRepository,
      undefined,
      mockProjectSettingsRepository
    );

    await useCase.execute({ ownerId: 'owner-1', projectId: 'project-1' });

    expect(mockProjectSettingsRepository.deleteByProjectId).toHaveBeenCalledWith('owner-1', 'project-1');
    expect(mockProjectRepository.deleteProject).toHaveBeenCalledWith('owner-1', 'project-1');
  });

  it('should delete metadata and settings before project', async () => {
    const callOrder: string[] = [];

    mockMetadataRepository.deleteByProjectId = vi.fn().mockImplementation(() => {
      callOrder.push('metadata');
      return Promise.resolve(undefined);
    });

    mockProjectSettingsRepository.deleteByProjectId = vi.fn().mockImplementation(() => {
      callOrder.push('settings');
      return Promise.resolve(undefined);
    });

    mockProjectRepository.deleteProject = vi.fn().mockImplementation(() => {
      callOrder.push('project');
      return Promise.resolve(undefined);
    });

    const useCase = new DeleteProjectUseCase(
      mockProjectRepository,
      mockMetadataRepository,
      mockProjectSettingsRepository
    );

    await useCase.execute({ ownerId: 'owner-1', projectId: 'project-1' });

    // Project should be deleted last
    expect(callOrder.indexOf('project')).toBeGreaterThan(callOrder.indexOf('metadata'));
    expect(callOrder.indexOf('project')).toBeGreaterThan(callOrder.indexOf('settings'));
  });
});
