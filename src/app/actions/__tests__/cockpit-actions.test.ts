// ABOUTME: Tests for cockpit server actions
// ABOUTME: Verifies project stats fetching and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjectStatsAction } from '../cockpit-actions';

// Mock auth
vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

// Mock repository
vi.mock('../utils', () => ({
  getRepository: vi.fn(),
}));

// Mock formatReadingTime
vi.mock('@/lib/utils', () => ({
  formatReadingTime: vi.fn((wordCount: number) => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min`;
  }),
}));

import { auth } from '@/infrastructure/auth/auth-config';
import { getRepository } from '../utils';

describe('getProjectStatsAction', () => {
  const mockProject = {
    getTotalWordCount: vi.fn(() => 5000),
    getTotalCharacterCount: vi.fn(() => 25000),
    getChapterCount: vi.fn(() => 5),
    getCreatedAt: vi.fn(() => new Date('2024-01-01')),
    getUpdatedAt: vi.fn(() => new Date('2024-01-15')),
    getTitle: vi.fn(() => 'Mon Roman'),
  };

  const mockRepository = {
    loadProject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRepository).mockResolvedValue(mockRepository as any);
  });

  it('returns project stats when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockRepository.loadProject.mockResolvedValue(mockProject);

    const result = await getProjectStatsAction('project-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.stats.wordCount).toBe(5000);
      expect(result.stats.characterCount).toBe(25000);
      expect(result.stats.chapterCount).toBe(5);
      expect(result.stats.readingTime).toBe('25 min');
      expect(result.stats.title).toBe('Mon Roman');
    }
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await getProjectStatsAction('project-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Non authentifié');
    }
  });

  it('returns error when session has no user id', async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as any);

    const result = await getProjectStatsAction('project-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Non authentifié');
    }
  });

  it('returns error when project not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockRepository.loadProject.mockResolvedValue(null);

    const result = await getProjectStatsAction('project-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Projet non trouvé');
    }
  });

  it('returns error on repository exception', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockRepository.loadProject.mockRejectedValue(new Error('DB error'));

    const result = await getProjectStatsAction('project-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Erreur lors du chargement des statistiques');
    }
  });
});
