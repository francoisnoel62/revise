// ABOUTME: Tests for UpdateProjectSettingsUseCase
// ABOUTME: Verifies project settings partial updates

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateProjectSettingsUseCase } from '../UpdateProjectSettingsUseCase';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';

describe('UpdateProjectSettingsUseCase', () => {
  let useCase: UpdateProjectSettingsUseCase;
  let mockRepository: {
    findByProjectId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockIdGenerator: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      findByProjectId: vi.fn(),
      create: vi.fn((userId, settings) => Promise.resolve(settings)),
      update: vi.fn((userId, settings) => Promise.resolve(settings)),
    };
    mockIdGenerator = { generate: vi.fn().mockReturnValue('generated-id') };

    useCase = new UpdateProjectSettingsUseCase(
      mockRepository as unknown as import('@/domain/interfaces/ProjectSettingsRepository').ProjectSettingsRepository,
      mockIdGenerator as unknown as import('@/domain/interfaces/IdGenerator').IdGenerator
    );
  });

  it('updates title', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Old Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { title: 'New Title' },
    });

    expect(result.getTitle()).toBe('New Title');
    expect(mockRepository.update).toHaveBeenCalled();
  });

  it('persists a publication profile change', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { publicationProfileId: 'passerelle' },
    });

    expect(result.getPublicationProfileId()).toBe('passerelle');
  });

  it('persists a grammar rule profile change', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { grammarRuleProfile: { gn: true, typo: false } },
    });

    expect(result.getGrammarRuleProfile()).toEqual({ gn: true, typo: false });
  });

  it('persists a toc preferences change', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { tocPreferences: { depth: 'chapters-and-subtitles', style: 'epure' } },
    });

    expect(result.getTocPreferences()).toEqual({ depth: 'chapters-and-subtitles', style: 'epure' });
  });

  it('persists an endnotes title change', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { endnotesTitle: 'Références' },
    });

    expect(result.getEndnotesTitle()).toBe('Références');
  });

  it('updates multiple fields at once', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: {
        title: 'New Title',
        subtitle: 'A Subtitle',
        genre: 'Fantasy',
        pointOfView: 'first_person',
        tense: 'past',
        targetAudience: 'adult',
      },
    });

    expect(result.getTitle()).toBe('New Title');
    expect(result.getSubtitle()).toBe('A Subtitle');
    expect(result.getGenre()).toBe('Fantasy');
    expect(result.getPointOfView()).toBe('first_person');
    expect(result.getTense()).toBe('past');
    expect(result.getTargetAudience()).toBe('adult');
  });

  it('updates contributors', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: {
        contributors: [{ name: 'John', role: 'author' }],
      },
    });

    expect(result.getContributors()).toEqual([{ name: 'John', role: 'author' }]);
  });

  it('updates relatedWorks', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: {
        relatedWorks: [{ title: 'Previous Book' }],
      },
    });

    expect(result.getRelatedWorks()).toEqual([{ title: 'Previous Book' }]);
  });

  it('clears optional fields when set to undefined', async () => {
    const settings = ProjectSettings.reconstruct({
      id: 'id-1',
      projectId: 'project-1',
      ownerId: 'user-1',
      title: 'Title',
      subtitle: 'Subtitle',
      summary: '',
      coverImageUrl: 'https://example.com/cover.jpg',
      genre: '',
      synopsis: '',
      pointOfView: 'first_person',
      tense: 'past',
      targetAudience: 'adult',
      isbn: '123',
      contributors: [],
      relatedWorks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: {
        subtitle: undefined,
        pointOfView: undefined,
      },
    });

    expect(result.getSubtitle()).toBeUndefined();
    expect(result.getPointOfView()).toBeUndefined();
  });

  it('creates settings and applies updates when settings not found', async () => {
    mockRepository.findByProjectId.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { publicationProfileId: 'a5' },
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(result.getPublicationProfileId()).toBe('a5');
  });

  it('throws error for empty title', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        updates: { title: '' },
      })
    ).rejects.toThrow('Project title cannot be empty');
  });

  it('updates canonExtractionPreferences mode', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      updates: { canonExtractionPreferences: { mode: 'session-end' } },
    });

    expect(result.getCanonExtractionPreferences().mode).toBe('session-end');
  });
});
