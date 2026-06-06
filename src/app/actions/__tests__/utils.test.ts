// ABOUTME: Unit tests for Server Action utilities
// ABOUTME: Tests getLLMProviderById helper function

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLLMProviderById } from '../utils';
import { Provider } from '@/domain/entities/Provider';
import type { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import * as providers from '@/infrastructure/config/providers';

// Mock the providers module
vi.mock('@/infrastructure/config/providers', async () => {
  const actual = await vi.importActual<typeof import('@/infrastructure/config/providers')>(
    '@/infrastructure/config/providers'
  );
  return {
    ...actual,
    getProviderRepository: vi.fn(),
    createLLMProvider: vi.fn(),
  };
});

describe('getLLMProviderById', () => {
  const mockProviderRepo: ProviderRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    listProviders: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    isUsedByProjects: vi.fn(),
    deleteAllByOwner: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providers.getProviderRepository).mockResolvedValue(mockProviderRepo);
  });

  it('should return LLM provider when provider exists and is valid', async () => {
    const mockProvider = Provider.create(
      'provider-1',
      'user-1',
      'Test Provider',
      'openai',
      'sk-test-key',
      'gpt-4o'
    );
    mockProvider.markAsValid();

    vi.mocked(mockProviderRepo.findById).mockResolvedValue(mockProvider);

    const mockLLMProvider = {
      rewriteText: vi.fn(),
      generateNarrativeAnalysis: vi.fn(),
      testConnection: vi.fn(),
      getProviderName: vi.fn(),
      getModel: vi.fn(),
    };
    vi.mocked(providers.createLLMProvider).mockReturnValue(mockLLMProvider as unknown as ReturnType<typeof providers.createLLMProvider>);

    const result = await getLLMProviderById('user-1', 'provider-1');

    expect(mockProviderRepo.findById).toHaveBeenCalledWith('user-1', 'provider-1');
    expect(providers.createLLMProvider).toHaveBeenCalledWith(mockProvider);
    expect(result).toBe(mockLLMProvider);
  });

  it('should throw error when provider not found', async () => {
    vi.mocked(mockProviderRepo.findById).mockResolvedValue(null);

    await expect(getLLMProviderById('user-1', 'non-existent')).rejects.toThrow(
      'Provider not found. Please select a valid provider.'
    );

    expect(mockProviderRepo.findById).toHaveBeenCalledWith('user-1', 'non-existent');
    expect(providers.createLLMProvider).not.toHaveBeenCalled();
  });

  it('should throw error when provider is invalid', async () => {
    const mockProvider = Provider.create(
      'provider-1',
      'user-1',
      'Invalid Provider',
      'openai',
      'sk-invalid-key',
      'gpt-4o'
    );
    // Don't mark as valid, so it remains invalid

    vi.mocked(mockProviderRepo.findById).mockResolvedValue(mockProvider);

    await expect(getLLMProviderById('user-1', 'provider-1')).rejects.toThrow(
      'Provider is invalid. Please test the connection or select a different provider.'
    );

    expect(mockProviderRepo.findById).toHaveBeenCalledWith('user-1', 'provider-1');
    expect(providers.createLLMProvider).not.toHaveBeenCalled();
  });
});
