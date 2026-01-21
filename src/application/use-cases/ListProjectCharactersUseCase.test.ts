// ABOUTME: Unit tests for ListProjectCharactersUseCase
// ABOUTME: Tests listing characters with mocked repository

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListProjectCharactersUseCase, ListProjectCharactersInput } from './ListProjectCharactersUseCase';
import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

describe('ListProjectCharactersUseCase', () => {
  let useCase: ListProjectCharactersUseCase;
  let mockRepository: CharacterRepository;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    useCase = new ListProjectCharactersUseCase(mockRepository);
  });

  it('should return empty array when no characters exist', async () => {
    const input: ListProjectCharactersInput = {
      userId: 'user-1',
      projectId: 'project-1',
    };

    const result = await useCase.execute(input);

    expect(result).toEqual([]);
  });

  it('should return all characters for a project', async () => {
    const characters = [
      Character.reconstruct({
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      Character.reconstruct({
        id: 'char-2',
        projectId: 'project-1',
        ownerId: 'user-1',
        name: 'Javert',
        identity: '',
        appearance: '',
        psychology: '',
        voiceAndLanguage: '',
        backstory: '',
        relationships: '',
        narrativeFunction: '',
        openQuestions: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    mockRepository.findByProjectId = vi.fn().mockResolvedValue(characters);

    const input: ListProjectCharactersInput = {
      userId: 'user-1',
      projectId: 'project-1',
    };

    const result = await useCase.execute(input);

    expect(result).toHaveLength(2);
    expect(result[0].getName()).toBe('Jean Valjean');
    expect(result[1].getName()).toBe('Javert');
  });

  it('should call repository with correct parameters', async () => {
    const input: ListProjectCharactersInput = {
      userId: 'user-1',
      projectId: 'project-1',
    };

    await useCase.execute(input);

    expect(mockRepository.findByProjectId).toHaveBeenCalledWith('user-1', 'project-1');
  });
});
