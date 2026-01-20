// ABOUTME: Tests for PublishProjectUseCase.
// ABOUTME: Validates project publishing with share token generation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublishProjectUseCase } from './PublishProjectUseCase';
import { ProjectNotFoundError } from './LoadProjectUseCase';
import { Project } from '@/domain/entities/Project';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';

describe('PublishProjectUseCase', () => {
  let mockRepository: ProjectRepository;
  let useCase: PublishProjectUseCase;
  const baseUrl = 'https://revise.app';

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
    useCase = new PublishProjectUseCase(mockRepository, baseUrl);
  });

  it('should publish a project and generate a share URL', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');
    vi.mocked(mockRepository.loadProject).mockResolvedValue(project);
    vi.mocked(mockRepository.updateProject).mockResolvedValue(project);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: project.getId(),
    });

    expect(result.project.getIsPublished()).toBe(true);
    expect(result.project.getShareToken()).toBeDefined();
    expect(result.project.getPublishedAt()).toBeInstanceOf(Date);
    expect(result.shareUrl).toContain('/read/');
    expect(result.shareUrl).toContain(project.getId());
    expect(result.shareUrl).toContain(result.project.getShareToken());
    expect(mockRepository.updateProject).toHaveBeenCalledWith('user-1', project);
  });

  it('should preserve existing share token when re-publishing', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');
    project.publish();
    const originalToken = project.getShareToken();
    project.unpublish();

    vi.mocked(mockRepository.loadProject).mockResolvedValue(project);
    vi.mocked(mockRepository.updateProject).mockResolvedValue(project);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: project.getId(),
    });

    expect(result.project.getShareToken()).toBe(originalToken);
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

  it('should generate correct share URL format', async () => {
    const project = Project.createEmpty('user-1', 'Mon Roman');
    vi.mocked(mockRepository.loadProject).mockResolvedValue(project);
    vi.mocked(mockRepository.updateProject).mockResolvedValue(project);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: project.getId(),
    });

    const expectedUrl = `${baseUrl}/read/${project.getId()}/${project.getShareToken()}`;
    expect(result.shareUrl).toBe(expectedUrl);
  });
});
