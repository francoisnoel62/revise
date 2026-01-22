// ABOUTME: Unit tests for CreateCharacterUseCase
// ABOUTME: Tests character creation with mocked repository

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCharacterUseCase, CreateCharacterInput } from './CreateCharacterUseCase';
import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

describe('CreateCharacterUseCase', () => {
  let useCase: CreateCharacterUseCase;
  let mockRepository: CharacterRepository;
  let mockIdGenerator: IdGenerator;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn().mockImplementation((userId, character) => Promise.resolve(character)),
      findById: vi.fn(),
      findByProjectId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    mockIdGenerator = {
      generate: vi.fn().mockReturnValue('generated-id'),
    };

    useCase = new CreateCharacterUseCase(mockRepository, mockIdGenerator);
  });

  it('should create a character with generated ID', async () => {
    const input: CreateCharacterInput = {
      userId: 'user-1',
      projectId: 'project-1',
      name: 'Jean Valjean',
    };

    const result = await useCase.execute(input);

    expect(result).toBeInstanceOf(Character);
    expect(result.getId()).toBe('generated-id');
    expect(result.getProjectId()).toBe('project-1');
    expect(result.getOwnerId()).toBe('user-1');
    expect(result.getName()).toBe('Jean Valjean');
  });

  it('should call repository.create with correct parameters', async () => {
    const input: CreateCharacterInput = {
      userId: 'user-1',
      projectId: 'project-1',
      name: 'Javert',
    };

    await useCase.execute(input);

    expect(mockRepository.create).toHaveBeenCalledTimes(1);
    expect(mockRepository.create).toHaveBeenCalledWith('user-1', expect.any(Character));
  });

  it('should generate a unique ID for each character', async () => {
    const input: CreateCharacterInput = {
      userId: 'user-1',
      projectId: 'project-1',
      name: 'Cosette',
    };

    await useCase.execute(input);

    expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
  });

  it('should throw error for empty character name', async () => {
    const input: CreateCharacterInput = {
      userId: 'user-1',
      projectId: 'project-1',
      name: '',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Character name cannot be empty');
  });
});
