// ABOUTME: Tests for LoadProjectSettingsUseCase
// ABOUTME: Verifies project settings loading by project ID

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadProjectSettingsUseCase } from '../LoadProjectSettingsUseCase';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';

describe('LoadProjectSettingsUseCase', () => {
  let useCase: LoadProjectSettingsUseCase;
  let mockRepository: { findByProjectId: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      findByProjectId: vi.fn(),
    };

    useCase = new LoadProjectSettingsUseCase(mockRepository as unknown as import('@/domain/interfaces/ProjectSettingsRepository').ProjectSettingsRepository);
  });

  it('returns settings when found', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'My Novel');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(result).not.toBeNull();
    expect(result?.getTitle()).toBe('My Novel');
    expect(mockRepository.findByProjectId).toHaveBeenCalledWith('user-1', 'project-1');
  });

  it('returns null when not found', async () => {
    mockRepository.findByProjectId.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(result).toBeNull();
  });
});
