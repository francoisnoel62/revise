// ABOUTME: Unit tests for SyncCharactersFromAnalysisUseCase
// ABOUTME: Tests syncing AI-generated character profiles with mocked repository

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncCharactersFromAnalysisUseCase, SyncCharactersFromAnalysisInput } from './SyncCharactersFromAnalysisUseCase';
import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { CharacterProfile } from '@/domain/value-objects/Characters';

describe('SyncCharactersFromAnalysisUseCase', () => {
  let useCase: SyncCharactersFromAnalysisUseCase;
  let mockRepository: CharacterRepository;
  let mockIdGenerator: IdGenerator;
  let idCounter: number;

  const createMockProfile = (name: string): CharacterProfile => ({
    name,
    identity: `${name} identity`,
    appearance: `${name} appearance`,
    psychology: `${name} psychology`,
    voiceAndLanguage: `${name} voice`,
    backstory: `${name} backstory`,
    relationships: `${name} relationships`,
    narrativeFunction: `${name} function`,
    openQuestions: `${name} questions`,
  });

  beforeEach(() => {
    idCounter = 1;

    mockRepository = {
      create: vi.fn().mockImplementation((userId, character) => Promise.resolve(character)),
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockImplementation((userId, character) => Promise.resolve(character)),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    mockIdGenerator = {
      generate: vi.fn().mockImplementation(() => `generated-id-${idCounter++}`),
    };

    useCase = new SyncCharactersFromAnalysisUseCase(mockRepository, mockIdGenerator);
  });

  it('should create new characters from profiles', async () => {
    const input: SyncCharactersFromAnalysisInput = {
      userId: 'user-1',
      projectId: 'project-1',
      characterProfiles: [createMockProfile('Jean Valjean')],
    };

    const result = await useCase.execute(input);

    expect(result.created).toHaveLength(1);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.created[0].getName()).toBe('Jean Valjean');
    expect(result.created[0].getIdentity()).toBe('Jean Valjean identity');
  });

  it('should update existing characters with matching names', async () => {
    const existingCharacter = Character.reconstruct({
      id: 'existing-char',
      projectId: 'project-1',
      ownerId: 'user-1',
      name: 'Jean Valjean',
      identity: 'Old identity',
      appearance: '',
      psychology: '',
      voiceAndLanguage: '',
      backstory: '',
      relationships: '',
      narrativeFunction: '',
      openQuestions: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.findByProjectId = vi.fn().mockResolvedValue([existingCharacter]);

    const input: SyncCharactersFromAnalysisInput = {
      userId: 'user-1',
      projectId: 'project-1',
      characterProfiles: [createMockProfile('Jean Valjean')],
    };

    const result = await useCase.execute(input);

    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].getIdentity()).toBe('Jean Valjean identity');
  });

  it('should match names case-insensitively', async () => {
    const existingCharacter = Character.reconstruct({
      id: 'existing-char',
      projectId: 'project-1',
      ownerId: 'user-1',
      name: 'JEAN VALJEAN',
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
    });

    mockRepository.findByProjectId = vi.fn().mockResolvedValue([existingCharacter]);

    const input: SyncCharactersFromAnalysisInput = {
      userId: 'user-1',
      projectId: 'project-1',
      characterProfiles: [createMockProfile('jean valjean')],
    };

    const result = await useCase.execute(input);

    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(1);
  });

  it('should create and update multiple characters', async () => {
    const existingCharacter = Character.reconstruct({
      id: 'existing-char',
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
    });

    mockRepository.findByProjectId = vi.fn().mockResolvedValue([existingCharacter]);

    const input: SyncCharactersFromAnalysisInput = {
      userId: 'user-1',
      projectId: 'project-1',
      characterProfiles: [
        createMockProfile('Jean Valjean'),
        createMockProfile('Javert'),
        createMockProfile('Cosette'),
      ],
    };

    const result = await useCase.execute(input);

    expect(result.created).toHaveLength(2);
    expect(result.updated).toHaveLength(1);
  });

  it('should skip invalid character names', async () => {
    const profiles: CharacterProfile[] = [
      createMockProfile('Valid Name'),
      {
        name: '',
        identity: '',
        appearance: '',
        psychology: '',
        voiceAndLanguage: '',
        backstory: '',
        relationships: '',
        narrativeFunction: '',
        openQuestions: '',
      },
    ];

    const input: SyncCharactersFromAnalysisInput = {
      userId: 'user-1',
      projectId: 'project-1',
      characterProfiles: profiles,
    };

    const result = await useCase.execute(input);

    expect(result.created).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toBe('');
  });

  it('should return empty arrays when no profiles provided', async () => {
    const input: SyncCharactersFromAnalysisInput = {
      userId: 'user-1',
      projectId: 'project-1',
      characterProfiles: [],
    };

    const result = await useCase.execute(input);

    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });
});
