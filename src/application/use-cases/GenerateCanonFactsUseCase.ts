// ABOUTME: Use case for extracting canon facts from a manuscript and reconciling them with the ledger
// ABOUTME: Derived facts replace prior derived ones; author facts are preserved (refutability)

import {
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  CanonFact,
  CanonFactRepository,
  CharacterRepository,
} from '../../domain';
import { hashText } from '../utils/text-hash';
import { extractProjectFullText } from '../services/project-text';

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

    const contentHash = hashText(fullText);
    const extraction = await this.llmProvider.generateCanonFacts(fullText, effectiveNames);

    const knownNameSet = new Set(effectiveNames.map((n) => n.toLowerCase()));
    const lastChapterIndex = chapters.length - 1;

    const facts: CanonFact[] = extraction.facts
      // Keep only facts about known characters (defensive: prompt already restricts this).
      .filter((f) => knownNameSet.has(f.entity.trim().toLowerCase()))
      .map((f) => {
        const validFromChapter = Math.min(Math.max(0, f.validFromChapter), lastChapterIndex);
        const sourceChapterId = chapters[validFromChapter]?.getId() ?? null;
        return CanonFact.create({
          id: this.idGenerator.generate(),
          ownerId: input.ownerId,
          projectId: input.projectId,
          entity: f.entity.trim(),
          statement: f.statement.trim(),
          validFromChapter,
          validToChapter: null,
          source: 'derived',
          sourceChapterId,
          contentHash,
          category: f.category,
        });
      });

    await this.canonFactRepository.replaceDerived(input.ownerId, input.projectId, facts);

    return { facts, factCount: facts.length, characterCount: effectiveNames.length };
  }
}
