// ABOUTME: Unit tests for UpdateCharacterUseCase
// ABOUTME: Tests character updates with mocked repository

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateCharacterUseCase, UpdateCharacterInput } from './UpdateCharacterUseCase';
import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

describe('UpdateCharacterUseCase', () => {
  let useCase: UpdateCharacterUseCase;
  let mockRepository: CharacterRepository;
  let existingCharacter: Character;

  beforeEach(() => {
    existingCharacter = Character.reconstruct({
      id: 'char-1',
      projectId: 'project-1',
      ownerId: 'user-1',
      name: 'Jean Valjean',
      identity: '',
      appearance: '',
      psychology: '',
      voiceAndLanguage: '',
      backstory: '',
      relationships: '',
      narrativeFunction: '',
      openQuestions: '',
      createdAt: new Date('2026-01-20T10:00:00Z'),
      updatedAt: new Date('2026-01-20T10:00:00Z'),
    });

    mockRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(existingCharacter),
      findByProjectId: vi.fn(),
      update: vi.fn().mockImplementation((userId, character) => Promise.resolve(character)),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    useCase = new UpdateCharacterUseCase(mockRepository);
  });

  it('should update character name', async () => {
    const input: UpdateCharacterInput = {
      userId: 'user-1',
      characterId: 'char-1',
      name: 'Monsieur Madeleine',
    };

    const result = await useCase.execute(input);

    expect(result.getName()).toBe('Monsieur Madeleine');
    expect(mockRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should update character identity', async () => {
    const input: UpdateCharacterInput = {
      userId: 'user-1',
      characterId: 'char-1',
      identity: 'Former convict turned mayor',
    };

    const result = await useCase.execute(input);

    expect(result.getIdentity()).toBe('Former convict turned mayor');
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateCharacterInput = {
      userId: 'user-1',
      characterId: 'char-1',
      identity: 'Former convict',
      appearance: 'Tall and strong',
      psychology: 'Tormented by guilt',
    };

    const result = await useCase.execute(input);

    expect(result.getIdentity()).toBe('Former convict');
    expect(result.getAppearance()).toBe('Tall and strong');
    expect(result.getPsychology()).toBe('Tormented by guilt');
  });

  it('should throw error when character not found', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null);

    const input: UpdateCharacterInput = {
      userId: 'user-1',
      characterId: 'non-existent',
      name: 'Test',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Character not found or access denied');
  });

  it('should throw error when updating name to empty', async () => {
    const input: UpdateCharacterInput = {
      userId: 'user-1',
      characterId: 'char-1',
      name: '',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Character name cannot be empty');
  });

  it('should allow clearing optional fields', async () => {
    existingCharacter = existingCharacter.updateIdentity('Some identity');
    mockRepository.findById = vi.fn().mockResolvedValue(existingCharacter);

    const input: UpdateCharacterInput = {
      userId: 'user-1',
      characterId: 'char-1',
      identity: '',
    };

    const result = await useCase.execute(input);

    expect(result.getIdentity()).toBe('');
  });
});
