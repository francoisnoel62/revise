// ABOUTME: Unit tests for GenerateCompletionUseCase
// ABOUTME: Tests completion generation with mocked AIContextBuilder and LLM provider

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateCompletionUseCase } from '../GenerateCompletionUseCase';
import { LLMProvider } from '../../../domain';
import { AIContextBuilder } from '../../services/AIContextBuilder';

describe('GenerateCompletionUseCase', () => {
  let mockBuilder: AIContextBuilder;
  let mockLLMProvider: LLMProvider;

  beforeEach(() => {
    mockBuilder = {
      buildCompletionContext: vi.fn().mockResolvedValue(''),
      buildChapterContext: vi.fn(),
      buildRewriteContext: vi.fn(),
    } as unknown as AIContextBuilder;

    mockLLMProvider = {
      generateCompletion: vi.fn().mockResolvedValue('suggested completion'),
      generateRewrites: vi.fn(),
      testConnection: vi.fn(),
      getProviderName: vi.fn().mockReturnValue('Mock'),
      getModel: vi.fn().mockReturnValue('mock-model'),
    } as unknown as LLMProvider;
  });

  it('should generate completion with project context', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'proj-1',
      textBeforeCursor: 'Emma walked into the',
    });

    expect(result.completion).toBe('suggested completion');
    expect(mockBuilder.buildCompletionContext).toHaveBeenCalledWith('user-1', 'proj-1', undefined);
    expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
      'Emma walked into the',
      undefined,
      ''
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
      ''
    );
  });

  it('should pass the chapterId to the context builder for locality', async () => {
    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await useCase.execute({
      ownerId: 'user-1',
      projectId: 'proj-1',
      textBeforeCursor: 'Emma walked',
      chapterId: 'chapter-7',
    });

    expect(mockBuilder.buildCompletionContext).toHaveBeenCalledWith('user-1', 'proj-1', 'chapter-7');
  });

  it('should pass the built project context block to LLM', async () => {
    vi.mocked(mockBuilder.buildCompletionContext).mockResolvedValue(
      '\n\n[MÉTADONNÉES - NARRATION]\nPoint de vue: Third person\n'
    );

    const useCase = new GenerateCompletionUseCase(mockBuilder, mockLLMProvider);
    await useCase.execute({
      ownerId: 'user-1',
      projectId: 'proj-1',
      textBeforeCursor: 'Emma walked',
    });

    expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
      'Emma walked',
      undefined,
      expect.stringContaining('Third person')
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
