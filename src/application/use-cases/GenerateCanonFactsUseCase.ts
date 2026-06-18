// ABOUTME: Use case for extracting canon facts from a manuscript and reconciling them with the ledger
// ABOUTME: Incremental per-chapter extraction: only reprocesses chapters whose content hash changed

import {
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  CanonFact,
  CanonFactRepository,
  CharacterRepository,
} from '../../domain';
import { hashText } from '../utils/text-hash';
import { extractProjectFullText, extractChapterText } from '../services/project-text';

export interface GenerateCanonFactsInput {
  ownerId: string;
  projectId: string;
}

export interface GenerateCanonFactsResult {
  facts: CanonFact[];
  factCount: number;
  /**
   * Number of known characters considered for extraction. Lets the caller tell
   * "0 facts because the project has no cast" apart from "0 facts extracted from
   * the text" — the former needs a "create characters first" hint, not a silent
   * empty result.
   */
  characterCount: number;
}

export class GenerateCanonFactsUseCase {
  constructor(
    private readonly canonFactRepository: CanonFactRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GenerateCanonFactsInput): Promise<GenerateCanonFactsResult> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    const project = await this.projectRepository.loadProject(input.ownerId, input.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const chapters = project.getChapters();
    if (chapters.length === 0) {
      throw new Error('Project has no chapters to analyze');
    }

    const fullText = extractProjectFullText(chapters);
    if (fullText.trim().length === 0) {
      throw new Error('Project chapters have no content to analyze');
    }

    const characters = await this.characterRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );
    let effectiveNames = characters.map((c) => c.getName());

    // No character sheets → ask the LLM to discover the main cast from the manuscript.
    if (effectiveNames.length === 0) {
      const discovered = await this.llmProvider.generateCharacters(fullText);
      effectiveNames = discovered.characterProfiles.map((p) => p.name).filter(Boolean);
      if (effectiveNames.length === 0) {
        await this.canonFactRepository.replaceDerived(input.ownerId, input.projectId, []);
        return { facts: [], factCount: 0, characterCount: 0 };
      }
    }

    const knownNameSet = new Set(effectiveNames.map((n) => n.toLowerCase()));

    // Compute per-chapter content hashes
    const currentHashes = new Map<string, string>();
    for (const ch of chapters) {
      const text = extractChapterText(ch);
      if (text.trim()) {
        currentHashes.set(ch.getId(), hashText(text));
      }
    }

    // Identify chapters that have changed (new or modified)
    const storedHashes = await this.canonFactRepository.getChapterHashes(
      input.ownerId,
      input.projectId
    );

    const changedChapters = chapters.filter((ch) => {
      const current = currentHashes.get(ch.getId());
      if (!current) return false; // empty chapter, skip
      return current !== storedHashes.get(ch.getId());
    });

    // If nothing changed, return existing derived facts without LLM calls
    if (changedChapters.length === 0) {
      const existing = await this.canonFactRepository.listByProject(
        input.ownerId,
        input.projectId
      );
      const derived = existing.filter((f) => f.getSource() === 'derived');
      return { facts: derived, factCount: derived.length, characterCount: effectiveNames.length };
    }

    // Extract facts per changed chapter
    const newFacts: CanonFact[] = [];
    const changedChapterIds: string[] = [];
    const factsWithInvalidates: Array<{ fact: CanonFact; invalidates: string }> = [];

    for (const ch of changedChapters) {
      const chapterIndex = chapters.findIndex((c) => c.getId() === ch.getId());
      const chapterText = extractChapterText(ch);
      const extraction = await this.llmProvider.generateCanonFacts(chapterText, effectiveNames);
      const chapterHash = currentHashes.get(ch.getId()) ?? null;

      const chapterFacts = extraction.facts
        .filter((f) => knownNameSet.has(f.entity.trim().toLowerCase()))
        .map((f) => {
          const fact = CanonFact.create({
            id: this.idGenerator.generate(),
            ownerId: input.ownerId,
            projectId: input.projectId,
            entity: f.entity.trim(),
            statement: f.statement.trim(),
            validFromChapter: chapterIndex,
            validToChapter: null,
            source: 'derived',
            sourceChapterId: ch.getId(),
            contentHash: chapterHash,
            category: f.category,
          });
          if (f.invalidates) {
            factsWithInvalidates.push({ fact, invalidates: f.invalidates });
          }
          return fact;
        });

      newFacts.push(...chapterFacts);
      changedChapterIds.push(ch.getId());
    }

    // Contradiction handling: set validToChapter on beliefs now contradicted by new facts.
    // Only targets facts from unchanged chapters (changed chapters are about to be replaced).
    if (factsWithInvalidates.length > 0) {
      const allExisting = await this.canonFactRepository.listByProject(
        input.ownerId,
        input.projectId
      );
      const unchangedChapterIdSet = new Set(
        chapters.map((c) => c.getId()).filter((id) => !changedChapterIds.includes(id))
      );

      for (const { fact: newFact, invalidates: stmt } of factsWithInvalidates) {
        const invalidated = allExisting.find(
          (f) =>
            unchangedChapterIdSet.has(f.getSourceChapterId() ?? '') &&
            f.getSource() === 'derived' &&
            f.getEntity().toLowerCase() === newFact.getEntity().toLowerCase() &&
            f.getStatement().trim() === stmt.trim() &&
            f.getValidToChapter() === null &&
            newFact.getValidFromChapter() > f.getValidFromChapter()
        );
        if (invalidated) {
          const validTo = Math.max(
            invalidated.getValidFromChapter(),
            newFact.getValidFromChapter() - 1
          );
          await this.canonFactRepository.update(
            input.ownerId,
            invalidated.withValidToChapter(validTo)
          );
        }
      }
    }

    // Replace derived facts for changed chapters only; preserve unchanged chapters' facts
    await this.canonFactRepository.replaceDerived(
      input.ownerId,
      input.projectId,
      newFacts,
      changedChapterIds
    );

    // Persist updated chapter hashes
    const updatedHashes = new Map(storedHashes);
    for (const [id, hash] of currentHashes) {
      updatedHashes.set(id, hash);
    }
    await this.canonFactRepository.saveChapterHashes(
      input.ownerId,
      input.projectId,
      updatedHashes
    );

    // Return all derived facts (new + preserved from unchanged chapters)
    const allFacts = await this.canonFactRepository.listByProject(
      input.ownerId,
      input.projectId
    );
    const derived = allFacts.filter((f) => f.getSource() === 'derived');
    return { facts: derived, factCount: derived.length, characterCount: effectiveNames.length };
  }
}
