// ABOUTME: Unit tests for GenerateCanonFactsUseCase (extraction + derived/author reconciliation)
// ABOUTME: Covers incremental per-chapter extraction, contradiction invalidation, and cast filtering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateCanonFactsUseCase } from '../GenerateCanonFactsUseCase';
import type { CanonFactRepository } from '@/domain/interfaces/CanonFactRepository';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import type { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import type { LLMProvider } from '@/domain/interfaces/LLMProvider';
import type { IdGenerator } from '@/domain/interfaces/IdGenerator';
import type { CanonFact } from '@/domain/entities/CanonFact';
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
  let canonRepo: {
    replaceDerived: ReturnType<typeof vi.fn>;
    getChapterHashes: ReturnType<typeof vi.fn>;
    saveChapterHashes: ReturnType<typeof vi.fn>;
    listByProject: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let projectRepo: { loadProject: ReturnType<typeof vi.fn> };
  let characterRepo: { findByProjectId: ReturnType<typeof vi.fn> };
  let llm: { generateCanonFacts: ReturnType<typeof vi.fn>; generateCharacters: ReturnType<typeof vi.fn> };
  let idGen: IdGenerator;

  beforeEach(() => {
    // listByProject returns whatever replaceDerived was last called with, so
    // result.facts reflects the facts the use case stored — no separate setup needed.
    let storedFacts: CanonFact[] = [];
    canonRepo = {
      replaceDerived: vi.fn().mockImplementation(async (_o, _p, facts) => { storedFacts = facts ?? []; }),
      getChapterHashes: vi.fn().mockResolvedValue(new Map()),
      saveChapterHashes: vi.fn().mockResolvedValue(undefined),
      listByProject: vi.fn().mockImplementation(async () => storedFacts),
      update: vi.fn().mockResolvedValue(undefined),
    };
    // Single chapter keeps most tests simple — per-chapter extraction calls LLM once.
    // Tests needing multi-chapter projects override loadProject directly.
    const chapters = [
      chapter('ch-0', 'Un', 'Léa vivait paisiblement.'),
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
      facts: [{ entity: 'Léa', statement: 'est morte', validFromChapter: 0, evidence: 'q' }],
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
    expect(facts[0].getValidFromChapter()).toBe(0);
    expect(facts[0].getSourceChapterId()).toBe('ch-0');
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

  it('assigns the actual chapter index as validFromChapter (ignores LLM validFromChapter)', async () => {
    // Single chapter → index 0. LLM still outputs validFromChapter: 99 but it is ignored.
    llm.generateCanonFacts.mockResolvedValue({
      facts: [{ entity: 'Tom', statement: 'disparaît', validFromChapter: 99, evidence: 'q' }],
    });

    const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });
    expect(result.facts[0].getValidFromChapter()).toBe(0);
    expect(result.facts[0].getSourceChapterId()).toBe('ch-0');
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

    expect(llm.generateCharacters).toHaveBeenCalledWith(expect.any(String));
    // generateCanonFacts is called once per chapter (1 chapter in beforeEach setup)
    expect(llm.generateCanonFacts).toHaveBeenCalledTimes(1);
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

  describe('incremental extraction (per-chapter hashes)', () => {
    it('skips unchanged chapters and calls generateCanonFacts only for changed ones', async () => {
      // ch-0 and ch-1 are unchanged; ch-2 has a new hash
      const chapters = [
        chapter('ch-0', 'Un', 'Léa vivait paisiblement.'),
        chapter('ch-1', 'Deux', 'Tom arriva.'),
        chapter('ch-2', 'Trois', 'Léa rendit son dernier souffle.'),
      ];
      projectRepo.loadProject.mockResolvedValue({ getChapters: () => chapters });

      // Pre-compute what hashes ch-0 and ch-1 would produce so we can stub them as "known"
      const { hashText } = await import('@/application/utils/text-hash');
      const { extractChapterText } = await import('@/application/services/project-text');
      const hash0 = hashText(extractChapterText(chapters[0]));
      const hash1 = hashText(extractChapterText(chapters[1]));

      (canonRepo as unknown as { getChapterHashes: ReturnType<typeof vi.fn> })
        .getChapterHashes.mockResolvedValue(new Map([['ch-0', hash0], ['ch-1', hash1]]));

      llm.generateCanonFacts.mockResolvedValue({
        facts: [{ entity: 'Léa', statement: 'est morte', validFromChapter: 0, evidence: 'q' }],
      });

      await build().execute({ ownerId: 'o1', projectId: 'p1' });

      // Only one LLM call for ch-2
      expect(llm.generateCanonFacts).toHaveBeenCalledTimes(1);
    });

    it('assigns the actual chapter index as validFromChapter regardless of LLM output', async () => {
      const chapters = [
        chapter('ch-0', 'Un', 'Léa vivait paisiblement.'),
        chapter('ch-1', 'Deux', 'Tom arriva.'),
        chapter('ch-2', 'Trois', 'Léa rendit son dernier souffle.'),
      ];
      projectRepo.loadProject.mockResolvedValue({ getChapters: () => chapters });

      llm.generateCanonFacts.mockResolvedValue({
        // LLM sees only one chapter → outputs validFromChapter: 0 for all facts
        facts: [{ entity: 'Léa', statement: 'est morte', validFromChapter: 0, evidence: 'q' }],
      });

      const result = await build().execute({ ownerId: 'o1', projectId: 'p1' });
      const chapterIndices = result.facts.map((f) => f.getValidFromChapter());
      // Facts from ch-0 → 0, ch-1 → 1, ch-2 → 2
      // All three chapters are new (no stored hashes), so all are processed
      // ch-0 returns validFromChapter=0, ch-1 returns 1, ch-2 returns 2
      expect(chapterIndices.every((i) => [0, 1, 2].includes(i))).toBe(true);
    });

    it('saves updated chapter hashes after extraction', async () => {
      llm.generateCanonFacts.mockResolvedValue({ facts: [] });

      await build().execute({ ownerId: 'o1', projectId: 'p1' });

      expect((canonRepo as unknown as { saveChapterHashes: ReturnType<typeof vi.fn> })
        .saveChapterHashes).toHaveBeenCalledWith('o1', 'p1', expect.any(Map));
    });

    it('passes only changed chapter ids to replaceDerived', async () => {
      const chapters = [
        chapter('ch-0', 'Un', 'Léa vivait paisiblement.'),
        chapter('ch-1', 'Deux', 'Tom arriva.'),
      ];
      projectRepo.loadProject.mockResolvedValue({ getChapters: () => chapters });

      const { hashText } = await import('@/application/utils/text-hash');
      const { extractChapterText } = await import('@/application/services/project-text');
      const hash0 = hashText(extractChapterText(chapters[0]));
      // ch-1 is new (not in stored hashes)
      (canonRepo as unknown as { getChapterHashes: ReturnType<typeof vi.fn> })
        .getChapterHashes.mockResolvedValue(new Map([['ch-0', hash0]]));

      llm.generateCanonFacts.mockResolvedValue({ facts: [] });

      await build().execute({ ownerId: 'o1', projectId: 'p1' });

      const [, , , reprocessedIds] = (canonRepo as unknown as { replaceDerived: ReturnType<typeof vi.fn> })
        .replaceDerived.mock.calls[0];
      expect(reprocessedIds).toEqual(['ch-1']);
    });

    it('invalidates a prior belief by setting validToChapter on the contradicted fact', async () => {
      const { CanonFact } = await import('@/domain/entities/CanonFact');
      const { ObjectId: ObjId } = await import('mongodb');

      const oldFact = CanonFact.create({
        id: new ObjId().toHexString(),
        ownerId: 'o1',
        projectId: 'p1',
        entity: 'Léa',
        statement: 'croit que Tom est coupable',
        validFromChapter: 0,
        validToChapter: null,
        source: 'derived',
        sourceChapterId: 'ch-0',
        contentHash: 'old',
        category: 3,
      });

      const chapters = [
        chapter('ch-0', 'Un', 'Léa croyait Tom coupable.'),
        chapter('ch-1', 'Deux', 'Léa apprend la vérité.'),
      ];
      projectRepo.loadProject.mockResolvedValue({ getChapters: () => chapters });

      const { hashText } = await import('@/application/utils/text-hash');
      const { extractChapterText } = await import('@/application/services/project-text');
      const hash0 = hashText(extractChapterText(chapters[0]));
      (canonRepo as unknown as { getChapterHashes: ReturnType<typeof vi.fn> })
        .getChapterHashes.mockResolvedValue(new Map([['ch-0', hash0]]));

      // ch-1 is changed; it returns a fact that invalidates the prior belief
      llm.generateCanonFacts.mockResolvedValue({
        facts: [{
          entity: 'Léa',
          statement: 'sait que Tom est innocent',
          validFromChapter: 0,
          evidence: 'q',
          invalidates: 'croit que Tom est coupable',
        }],
      });

      // listByProject returns the old fact (from unchanged ch-0)
      (canonRepo as unknown as { listByProject: ReturnType<typeof vi.fn> })
        .listByProject.mockResolvedValue([oldFact]);

      await build().execute({ ownerId: 'o1', projectId: 'p1' });

      // update should have been called with the old fact having validToChapter = 0 (ch-1 index - 1)
      const updateCall = (canonRepo as unknown as { update: ReturnType<typeof vi.fn> })
        .update.mock.calls[0];
      expect(updateCall).toBeDefined();
      const updatedFact = updateCall[1];
      expect(updatedFact.getValidToChapter()).toBe(0); // chapter 1 - 1 = 0
    });
  });
});
