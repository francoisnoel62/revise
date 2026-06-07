// ABOUTME: Unit tests for GenerateCharacterSheetUseCase
// ABOUTME: Validates character loading, context assembly, LLM delegation, and error cases

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateCharacterSheetUseCase, GenerateCharacterSheetInput } from '../GenerateCharacterSheetUseCase';
import { Character } from '../../../domain/entities/Character';

const makeCharacter = (overrides: Partial<{ identity: string; appearance: string; psychology: string }> = {}) => {
  const char = Character.create('char-1', 'proj-1', 'user-1', 'Alice');
  // Apply overrides via update if needed — use the raw character for now
  return char;
};

const makeInput = (overrides: Partial<GenerateCharacterSheetInput> = {}): GenerateCharacterSheetInput => ({
  ownerId: 'user-1',
  projectId: 'proj-1',
  characterId: 'char-1',
  ...overrides,
});

const generatedFields = {
  identity: 'Femme, 30 ans, détective',
  appearance: 'Grande, cheveux noirs',
  psychology: 'Déterminée, solitaire',
  voiceAndLanguage: 'Parle peu, ton sec',
  backstory: 'Ancienne militaire',
  relationships: 'Méfiance envers ses collègues',
  narrativeFunction: 'Protagoniste enquêtrice',
  openQuestions: 'Quel est son vrai mobile ?',
};

describe('GenerateCharacterSheetUseCase', () => {
  let characterRepo: any;
  let projectRepo: any;
  let metadataRepo: any;
  let llmProvider: any;
  let useCase: GenerateCharacterSheetUseCase;

  beforeEach(() => {
    const project = {
      getChapters: vi.fn().mockReturnValue([
        {
          getTitle: vi.fn().mockReturnValue('Chapitre 1'),
          getContent: vi.fn().mockReturnValue(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Il était une fois Alice.' }] }] })),
        },
      ]),
    };

    characterRepo = {
      findById: vi.fn().mockResolvedValue(makeCharacter()),
      create: vi.fn(),
      findByProjectId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
      countByProjectId: vi.fn(),
    };

    projectRepo = {
      loadProject: vi.fn().mockResolvedValue(project),
    };

    metadataRepo = {
      findByProjectAndType: vi.fn().mockResolvedValue(null),
    };

    llmProvider = {
      generateCharacterSheet: vi.fn().mockResolvedValue(generatedFields),
    };

    useCase = new GenerateCharacterSheetUseCase(
      characterRepo,
      projectRepo,
      metadataRepo,
      llmProvider,
    );
  });

  it('returns the generated fields from the LLM', async () => {
    const result = await useCase.execute(makeInput());
    expect(result).toEqual(generatedFields);
  });

  it('calls the LLM with the character name', async () => {
    await useCase.execute(makeInput());
    const [characterName] = llmProvider.generateCharacterSheet.mock.calls[0];
    expect(characterName).toBe('Alice');
  });

  it('assembles project context including manuscript text', async () => {
    await useCase.execute(makeInput());
    const [, , projectContext] = llmProvider.generateCharacterSheet.mock.calls[0];
    expect(typeof projectContext).toBe('string');
    expect(projectContext.length).toBeGreaterThan(0);
  });

  it('includes narrative-analysis metadata in context when available', async () => {
    const narrativeMeta = {
      getContentText: vi.fn().mockReturnValue('Narration à la première personne.'),
    };
    metadataRepo.findByProjectAndType.mockImplementation((_uid: string, _pid: string, type: string) =>
      type === 'narrative-analysis' ? narrativeMeta : null
    );

    await useCase.execute(makeInput());
    const [, , projectContext] = llmProvider.generateCharacterSheet.mock.calls[0];
    expect(projectContext).toContain('Narration à la première personne.');
  });

  it('includes plot metadata in context when available', async () => {
    const plotMeta = {
      getContentText: vi.fn().mockReturnValue('Conflit central : vengeance vs justice.'),
    };
    metadataRepo.findByProjectAndType.mockImplementation((_uid: string, _pid: string, type: string) =>
      type === 'plot' ? plotMeta : null
    );

    await useCase.execute(makeInput());
    const [, , projectContext] = llmProvider.generateCharacterSheet.mock.calls[0];
    expect(projectContext).toContain('Conflit central : vengeance vs justice.');
  });

  it('passes existing character fields to the LLM', async () => {
    await useCase.execute(makeInput());
    const [, existingFields] = llmProvider.generateCharacterSheet.mock.calls[0];
    expect(existingFields).toHaveProperty('identity');
    expect(existingFields).toHaveProperty('appearance');
    expect(existingFields).toHaveProperty('psychology');
    expect(existingFields).toHaveProperty('voiceAndLanguage');
    expect(existingFields).toHaveProperty('backstory');
    expect(existingFields).toHaveProperty('relationships');
    expect(existingFields).toHaveProperty('narrativeFunction');
    expect(existingFields).toHaveProperty('openQuestions');
  });

  it('throws when the character is not found', async () => {
    characterRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(makeInput())).rejects.toThrow('Character not found');
  });

  it('throws when the project is not found', async () => {
    projectRepo.loadProject.mockResolvedValue(null);
    await expect(useCase.execute(makeInput())).rejects.toThrow('Project not found');
  });

  it('throws when ownerId is empty', async () => {
    await expect(useCase.execute(makeInput({ ownerId: '' }))).rejects.toThrow('Owner ID is required');
  });

  it('throws when projectId is empty', async () => {
    await expect(useCase.execute(makeInput({ projectId: '' }))).rejects.toThrow('Project ID is required');
  });

  it('throws when characterId is empty', async () => {
    await expect(useCase.execute(makeInput({ characterId: '' }))).rejects.toThrow('Character ID is required');
  });

  it('works gracefully when the project has no chapters', async () => {
    projectRepo.loadProject.mockResolvedValue({ getChapters: vi.fn().mockReturnValue([]) });

    const result = await useCase.execute(makeInput());
    expect(result).toEqual(generatedFields);
    const [, , projectContext] = llmProvider.generateCharacterSheet.mock.calls[0];
    expect(typeof projectContext).toBe('string');
  });
});
