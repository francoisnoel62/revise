// ABOUTME: Tests for LoadPublishedProjectUseCase.
// ABOUTME: Validates loading published projects via share token.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadPublishedProjectUseCase, PublishedProjectNotFoundError } from './LoadPublishedProjectUseCase';
import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

describe('LoadPublishedProjectUseCase', () => {
  let mockRepository: ProjectRepository;
  let useCase: LoadPublishedProjectUseCase;

  beforeEach(() => {
    mockRepository = {
      loadProject: vi.fn(),
      updateProject: vi.fn(),
      createProject: vi.fn(),
      listProjects: vi.fn(),
      deleteProject: vi.fn(),
      updateChapter: vi.fn(),
      replaceProjectIfUnchanged: vi.fn(),
      deleteAllByOwner: vi.fn(),
      findPublishedByToken: vi.fn(),
    };
    useCase = new LoadPublishedProjectUseCase(mockRepository);
  });

  it('should load a published project with valid token', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');
    project.publish();
    const shareToken = project.getShareToken()!;

    vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(project);

    const result = await useCase.execute({
      projectId: project.getId(),
      shareToken,
    });

    expect(result).toBe(project);
    expect(result.getIsPublished()).toBe(true);
    expect(mockRepository.findPublishedByToken).toHaveBeenCalledWith(
      project.getId(),
      shareToken
    );
  });

  it('should throw PublishedProjectNotFoundError when project not found', async () => {
    vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(null);

    await expect(
      useCase.execute({
        projectId: 'non-existent',
        shareToken: 'invalid-token',
      })
    ).rejects.toThrow(PublishedProjectNotFoundError);
  });

  it('should throw error when token is invalid', async () => {
    vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(null);

    await expect(
      useCase.execute({
        projectId: 'project-1',
        shareToken: 'wrong-token',
      })
    ).rejects.toThrow(PublishedProjectNotFoundError);
  });

  it('should not require authentication', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');
    project.publish();

    vi.mocked(mockRepository.findPublishedByToken).mockResolvedValue(project);

    const result = await useCase.execute({
      projectId: project.getId(),
      shareToken: project.getShareToken()!,
    });

    expect(result.getOwnerId()).toBe('user-1');
    expect(mockRepository.loadProject).not.toHaveBeenCalled();
  });
});
