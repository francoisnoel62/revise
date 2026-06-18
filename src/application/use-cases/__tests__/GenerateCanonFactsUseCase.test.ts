// ABOUTME: Unit tests for GenerateCanonFactsUseCase (extraction + derived/author reconciliation)
// ABOUTME: Verifies cast filtering, chapter resolution, and that replaceDerived receives derived facts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateCanonFactsUseCase } from '../GenerateCanonFactsUseCase';
import type { CanonFactRepository } from '@/domain/interfaces/CanonFactRepository';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import type { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import type { LLMProvider } from '@/domain/interfaces/LLMProvider';
import type { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { ObjectId } from 'mongodb';

function chapter(id: string, title: string, text: string) {
  return {
    getId: () => id,
    getTitle: () => title,
    getContent: () => JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }),
    getOrder: () => 0,
  };
}

describe('GenerateCanonFactsUseCase', () => {
  let canonRepo: { replaceDerived: ReturnType<typeof vi.fn> };
  let projectRepo: { loadProject: ReturnType<typeof vi.fn> };
  let characterRepo: { findByProjectId: ReturnType<typeof vi.fn> };
  let llm: { generateCanonFacts: ReturnType<typeof vi.fn>; generateCharacters: ReturnType<typeof vi.fn> };
  let idGen: IdGenerator;

  beforeEach(() => {
    canonRepo = { replaceDerived: vi.fn().mockResolvedValue(undefined) };
    const chapters = [
      chapter('ch-0', 'Un', 'Léa vivait paisiblement.'),
      chapter('ch-1', 'Deux', 'Tom arriva.'),
      chapter('ch-2', 'Trois', 'Léa rendit son dernier souffle.'),
    ];
    projectRepo = {
      loadProject: vi.fn().mockResolvedValue({ getChapters: () => chapters }),
    };
    characterRepo = {
      findByProjectId: vi.fn().mockResolvedValue([
        { getName: () => 'Léa' },
        { getName: () => 'Tom' },
      ]),
    };
    llm = {
      generateCanonFacts: vi.fn(),
      generateCharacters: vi.fn(),
    };
    idGen = { generate: () => new ObjectId().toHexString() };
  });

  function build() {
    return new GenerateCanonFactsUseCase(
      canonRepo as unknown as CanonFactRepository,
      projectRepo as unknown as ProjectRepository,
      characterRepo as unknown as CharacterRepository,
      llm as unknown as LLMProvider,
      idGen
    );
  }

  it('maps extracted facts to derived CanonFacts and reconciles via replaceDerived', async () => {
    llm.generateCanonFacts.mockResolvedValue({
      facts: [{ entity: 'Léa', statement: 'est morte', validFromChapter: 2, evidence: 'q' }],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });

    expect(result.factCount).toBe(1);
    expect(result.characterCount).toBe(2);
    const [ownerId, projectId, facts] = canonRepo.replaceDerived.mock.calls[0];
    expect(ownerId).toBe('o1');
    expect(projectId).toBe('p1');
    expect(facts).toHaveLength(1);
    expect(facts[0].getEntity()).toBe('Léa');
    expect(facts[0].getSource()).toBe('derived');
    expect(facts[0].getValidFromChapter()).toBe(2);
    expect(facts[0].getSourceChapterId()).toBe('ch-2');
    expect(facts[0].getContentHash()).not.toBeNull();
  });

  it('drops facts about unknown characters', async () => {
    llm.generateCanonFacts.mockResolvedValue({
      facts: [
        { entity: 'Léa', statement: 'est morte', validFromChapter: 2, evidence: 'q' },
        { entity: 'Inconnu', statement: 'apparaît', validFromChapter: 0, evidence: 'q' },
      ],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });
    expect(result.factCount).toBe(1);
    expect(result.facts[0].getEntity()).toBe('Léa');
  });

  it('clamps an out-of-range chapter index to the last chapter', async () => {
    llm.generateCanonFacts.mockResolvedValue({
      facts: [{ entity: 'Tom', statement: 'disparaît', validFromChapter: 99, evidence: 'q' }],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });
    expect(result.facts[0].getValidFromChapter()).toBe(2);
    expect(result.facts[0].getSourceChapterId()).toBe('ch-2');
  });

  it('discovers characters from the manuscript when no character sheets exist', async () => {
    characterRepo.findByProjectId.mockResolvedValue([]);
    llm.generateCharacters.mockResolvedValue({
      characterProfiles: [{ name: 'Léa' }, { name: 'Tom' }],
      relationalMap: '',
      narrativeHierarchy: '',
      summary: '',
    });
    llm.generateCanonFacts.mockResolvedValue({
      facts: [{ entity: 'Léa', statement: 'est morte', validFromChapter: 2, evidence: 'q' }],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });

    expect(llm.generateCharacters).toHaveBeenCalledTimes(1);
    expect(llm.generateCanonFacts).toHaveBeenCalledWith(expect.any(String), ['Léa', 'Tom']);
    expect(result.factCount).toBe(1);
    expect(result.characterCount).toBe(2);
    expect(result.facts[0].getEntity()).toBe('Léa');
  });

  it('clears derived facts and skips canon extraction when no sheets and LLM finds no characters', async () => {
    characterRepo.findByProjectId.mockResolvedValue([]);
    llm.generateCharacters.mockResolvedValue({
      characterProfiles: [],
      relationalMap: '',
      narrativeHierarchy: '',
      summary: '',
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });

    expect(llm.generateCharacters).toHaveBeenCalledTimes(1);
    expect(llm.generateCanonFacts).not.toHaveBeenCalled();
    expect(result.factCount).toBe(0);
    expect(result.characterCount).toBe(0);
    expect(canonRepo.replaceDerived).toHaveBeenCalledWith('o1', 'p1', []);
  });

  it('preserves the category extracted by the LLM on the CanonFact', async () => {
    llm.generateCanonFacts.mockResolvedValue({
      facts: [
        { entity: 'Léa', statement: 'sait que Tom est le traître', validFromChapter: 1, evidence: 'q', category: 2 },
        { entity: 'Tom', statement: 'croit à tort que Léa est morte', validFromChapter: 2, evidence: 'q', category: 3 },
      ],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });

    expect(result.factCount).toBe(2);
    expect(result.facts[0].getCategory()).toBe(2);
    expect(result.facts[1].getCategory()).toBe(3);
  });

  it('defaults category to 1 when not provided by the LLM', async () => {
    llm.generateCanonFacts.mockResolvedValue({
      facts: [
        { entity: 'Léa', statement: 'est morte', validFromChapter: 2, evidence: 'q' },
      ],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });

    expect(result.facts[0].getCategory()).toBe(1);
  });
});
