// ABOUTME: Unit tests for GetAccountBalanceUseCase
// ABOUTME: Tests balance retrieval via provider factory and repository

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAccountBalanceUseCase } from '../GetAccountBalanceUseCase';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { Provider } from '@/domain/entities/Provider';
import {
  AccountBalance,
  createAccountBalance,
  createUnavailableBalance,
} from '@/domain/value-objects/AccountBalance';

describe('GetAccountBalanceUseCase', () => {
  let useCase: GetAccountBalanceUseCase;
  let mockProviderRepository: ProviderRepository;
  let mockLLMProviderFactory: LLMProviderFactory;
  let mockLLMProvider: LLMProvider;
  let mockProvider: Provider;

  beforeEach(() => {
    // Create mock provider entity
    mockProvider = Provider.create(
      'provider-1',
      'user-1',
      'Test OpenAI',
      'openai',
      'sk-test-key',
      'gpt-4o'
    );

    // Create mock LLM provider with all required methods
    mockLLMProvider = {
      generateRewrites: vi.fn(),
      testConnection: vi.fn(),
      getProviderName: vi.fn().mockReturnValue('OpenAI'),
      getModel: vi.fn().mockReturnValue('gpt-4o'),
      generateNarrativeAnalysis: vi.fn(),
      generateStylisticDNA: vi.fn(),
      generateCharacters: vi.fn(),
      generatePlot: vi.fn(),
      generateWorldbuilding: vi.fn(),
      generateSynthesis: vi.fn(),
      getAccountBalance: vi.fn(),
    };

    // Create mock repository
    mockProviderRepository = {
      findById: vi.fn().mockResolvedValue(mockProvider),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // Create mock factory
    mockLLMProviderFactory = {
      create: vi.fn().mockReturnValue(mockLLMProvider),
    };

    useCase = new GetAccountBalanceUseCase(
      mockProviderRepository,
      mockLLMProviderFactory
    );
  });

  it('should return account balance for existing provider', async () => {
    const expectedBalance = createAccountBalance(42.5, 100, null, 'USD');
    (mockLLMProvider.getAccountBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
      expectedBalance
    );

    const result = await useCase.execute({
      userId: 'user-1',
      providerId: 'provider-1',
    });

    expect(result).toEqual(expectedBalance);
    expect(mockProviderRepository.findById).toHaveBeenCalledWith(
      'user-1',
      'provider-1'
    );
    expect(mockLLMProviderFactory.create).toHaveBeenCalledWith(mockProvider);
    expect(mockLLMProvider.getAccountBalance).toHaveBeenCalled();
  });

  it('should return unavailable balance when provider reports unavailable', async () => {
    const unavailableBalance = createUnavailableBalance('Admin API key required');
    (mockLLMProvider.getAccountBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
      unavailableBalance
    );

    const result = await useCase.execute({
      userId: 'user-1',
      providerId: 'provider-1',
    });

    expect(result.available).toBe(false);
    expect(result.errorMessage).toBe('Admin API key required');
  });

  it('should throw error when provider not found', async () => {
    (mockProviderRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        providerId: 'non-existent',
      })
    ).rejects.toThrow('Provider not found');
  });

  it('should handle balance with renewal date', async () => {
    const renewalDate = new Date('2026-02-01');
    const balanceWithRenewal = createAccountBalance(25.0, 50.0, renewalDate, 'USD');
    (mockLLMProvider.getAccountBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
      balanceWithRenewal
    );

    const result = await useCase.execute({
      userId: 'user-1',
      providerId: 'provider-1',
    });

    expect(result.renewalDate).toEqual(renewalDate);
    expect(result.limit).toBe(50.0);
  });

  it('should handle balance without limit', async () => {
    const balanceWithoutLimit = createAccountBalance(75.0, null, null, 'USD');
    (mockLLMProvider.getAccountBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
      balanceWithoutLimit
    );

    const result = await useCase.execute({
      userId: 'user-1',
      providerId: 'provider-1',
    });

    expect(result.limit).toBeNull();
    expect(result.used).toBe(75.0);
  });
});
