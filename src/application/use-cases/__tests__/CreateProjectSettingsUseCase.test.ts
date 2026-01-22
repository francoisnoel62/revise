// ABOUTME: Tests for CreateProjectSettingsUseCase
// ABOUTME: Verifies project settings creation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProjectSettingsUseCase } from '../CreateProjectSettingsUseCase';

describe('CreateProjectSettingsUseCase', () => {
  let useCase: CreateProjectSettingsUseCase;
  let mockRepository: {
    create: ReturnType<typeof vi.fn>;
    findByProjectId: ReturnType<typeof vi.fn>;
  };
  let mockIdGenerator: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      create: vi.fn((userId, settings) => Promise.resolve(settings)),
      findByProjectId: vi.fn(() => Promise.resolve(null)),
    };

    mockIdGenerator = {
      generate: vi.fn(() => 'generated-id'),
    };

    useCase = new CreateProjectSettingsUseCase(mockRepository, mockIdGenerator);
  });

  it('creates settings with valid input', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      title: 'My Novel',
    });

    expect(result.getId()).toBe('generated-id');
    expect(result.getProjectId()).toBe('project-1');
    expect(result.getOwnerId()).toBe('user-1');
    expect(result.getTitle()).toBe('My Novel');
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('creates settings with trimmed title', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      title: '  My Novel  ',
    });

    expect(result.getTitle()).toBe('My Novel');
  });

  it('throws error for empty title', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        title: '',
      })
    ).rejects.toThrow('Project title cannot be empty');
  });

  it('throws error for empty projectId', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: '',
        title: 'My Novel',
      })
    ).rejects.toThrow('Project ID cannot be empty');
  });
});
