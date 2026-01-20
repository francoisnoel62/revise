// ABOUTME: Tests for UnpublishProjectUseCase.
// ABOUTME: Validates project unpublishing while preserving share token.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnpublishProjectUseCase } from './UnpublishProjectUseCase';
import { ProjectNotFoundError } from './LoadProjectUseCase';
import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

describe('UnpublishProjectUseCase', () => {
  let mockRepository: ProjectRepository;
  let useCase: UnpublishProjectUseCase;

  beforeEach(() => {
    mockRepository = {
      loadProject: vi.fn(),
      updateProject: vi.fn(),
      createProject: vi.fn(),
      listProjects: vi.fn(),
      deleteProject: vi.fn(),
      updateChapter: vi.fn(),
      deleteAllByOwner: vi.fn(),
      findPublishedByToken: vi.fn(),
    };
    useCase = new UnpublishProjectUseCase(mockRepository);
  });

  it('should unpublish a published project', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');
    project.publish();
    const originalToken = project.getShareToken();

    vi.mocked(mockRepository.loadProject).mockResolvedValue(project);
    vi.mocked(mockRepository.updateProject).mockResolvedValue(project);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: project.getId(),
    });

    expect(result.getIsPublished()).toBe(false);
    expect(result.getShareToken()).toBe(originalToken);
    expect(mockRepository.updateProject).toHaveBeenCalledWith('user-1', project);
  });

  it('should throw ProjectNotFoundError when project does not exist', async () => {
    vi.mocked(mockRepository.loadProject).mockResolvedValue(null);

    await expect(
      useCase.execute({
        ownerId: 'user-1',
        projectId: 'non-existent',
      })
    ).rejects.toThrow(ProjectNotFoundError);
  });

  it('should handle already unpublished project', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');

    vi.mocked(mockRepository.loadProject).mockResolvedValue(project);
    vi.mocked(mockRepository.updateProject).mockResolvedValue(project);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: project.getId(),
    });

    expect(result.getIsPublished()).toBe(false);
  });
});
