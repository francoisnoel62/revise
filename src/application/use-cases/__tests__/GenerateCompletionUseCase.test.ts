// ABOUTME: Unit tests for GenerateCompletionUseCase
// ABOUTME: Tests completion generation with mocked MetadataContextBuilder and LLM provider

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateCompletionUseCase } from '../GenerateCompletionUseCase';
import { LLMProvider } from '../../../domain';
import { MetadataContextBuilder } from '../../services/MetadataContextBuilder';

describe('GenerateCompletionUseCase', () => {
  let mockBuilder: MetadataContextBuilder;
  let mockLLMProvider: LLMProvider;

  beforeEach(() => {
    mockBuilder = {
      buildForCompletion: vi.fn().mockResolvedValue({}),
      buildForChapterGeneration: vi.fn(),
      buildForRewrite: vi.fn(),
      buildForSynthesis: vi.fn(),
    } as unknown as MetadataContextBuilder;

    mockLLMProvider = {
      generateCompletion: vi.fn().mockResolvedValue('suggested completion'),
      generateRewrites: vi.fn(),
      testConnection: vi.fn(),
      getProviderName: vi.fn().mockReturnValue('Mock'),
      getModel: vi.fn().mockReturnValue('mock-model'),
    } as unknown as LLMProvider;
  });

  it('should generate completion with metadata context', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'proj-1',
      textBeforeCursor: 'Emma walked into the',
    });

    expect(result.completion).toBe('suggested completion');
    expect(mockBuilder.buildForCompletion).toHaveBeenCalledWith('user-1', 'proj-1');
    expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
      'Emma walked into the',
      undefined,
      {}
    );
  });

  it('should pass textAfterCursor to LLM', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await useCase.execute({
      ownerId: 'user-1',
      projectId: 'proj-1',
      textBeforeCursor: 'Emma walked into the',
      textAfterCursor: ', clutching her coat.',
    });

    expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
      'Emma walked into the',
      ', clutching her coat.',
      {}
    );
  });

  it('should pass metadata context to LLM', async () => {
    const ctx = { narrative: { narratorType: 'Third person' } };
    vi.mocked(mockBuilder.buildForCompletion).mockResolvedValue(ctx as never);

    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await useCase.execute({
      ownerId: 'user-1',
      projectId: 'proj-1',
      textBeforeCursor: 'Emma walked',
    });

    expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
      'Emma walked',
      undefined,
      expect.objectContaining({ narrative: expect.any(Object) })
    );
  });

  it('should throw if ownerId is empty', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await expect(
      useCase.execute({ ownerId: '', projectId: 'proj-1', textBeforeCursor: 'Hello' })
    ).rejects.toThrow('Owner ID is required');
  });

  it('should throw if projectId is empty', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await expect(
      useCase.execute({ ownerId: 'user-1', projectId: '', textBeforeCursor: 'Hello' })
    ).rejects.toThrow('Project ID is required');
  });

  it('should throw if textBeforeCursor is empty', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await expect(
      useCase.execute({ ownerId: 'user-1', projectId: 'proj-1', textBeforeCursor: '' })
    ).rejects.toThrow('Text before cursor is required');
  });
});
