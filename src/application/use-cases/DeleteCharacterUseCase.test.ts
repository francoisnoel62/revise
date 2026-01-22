// ABOUTME: Unit tests for DeleteCharacterUseCase
// ABOUTME: Tests character deletion with mocked repository

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteCharacterUseCase, DeleteCharacterInput } from './DeleteCharacterUseCase';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

describe('DeleteCharacterUseCase', () => {
  let useCase: DeleteCharacterUseCase;
  let mockRepository: CharacterRepository;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByProjectId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    useCase = new DeleteCharacterUseCase(mockRepository);
  });

  it('should delete a character', async () => {
    const input: DeleteCharacterInput = {
      userId: 'user-1',
      characterId: 'char-1',
    };

    await useCase.execute(input);

    expect(mockRepository.delete).toHaveBeenCalledWith('user-1', 'char-1');
  });

  it('should throw error when character not found', async () => {
    mockRepository.delete = vi.fn().mockRejectedValue(new Error('Character not found or access denied'));

    const input: DeleteCharacterInput = {
      userId: 'user-1',
      characterId: 'non-existent',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Character not found or access denied');
  });
});
