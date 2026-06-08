// ABOUTME: Use case for generating or completing a character sheet via AI.
// ABOUTME: Loads character + project context + metadata, calls LLM, returns 8 fields without persisting.

import { CharacterRepository } from '../../domain/interfaces/CharacterRepository';
import { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import { MetadataRepository } from '../../domain/interfaces/MetadataRepository';
import { LLMProvider } from '../../domain/interfaces/LLMProvider';
import { CharacterProfile } from '../../domain/value-objects/Characters';
import { extractProjectFullText } from '../services/project-text';

const MANUSCRIPT_CHAR_CAP = 12_000;

export interface GenerateCharacterSheetInput {
  ownerId: string;
  projectId: string;
  characterId: string;
}

export type GenerateCharacterSheetResult = Omit<CharacterProfile, 'name'>;

export class GenerateCharacterSheetUseCase {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly llmProvider: LLMProvider,
  ) {}

  async execute(input: GenerateCharacterSheetInput): Promise<GenerateCharacterSheetResult> {
    const { ownerId, projectId, characterId } = input;

    if (!ownerId || ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }
    if (!characterId || characterId.trim().length === 0) {
      throw new Error('Character ID is required');
    }

    const [character, project] = await Promise.all([
      this.characterRepository.findById(ownerId, characterId),
      this.projectRepository.loadProject(ownerId, projectId),
    ]);

    if (!character) throw new Error('Character not found');
    if (!project) throw new Error('Project not found');

    const chapters = project.getChapters();
    const fullText = chapters.length > 0 ? extractProjectFullText(chapters) : '';

    const [narrativeMeta, plotMeta] = await Promise.all([
      this.metadataRepository.findByProjectAndType(ownerId, projectId, 'narrative-analysis'),
      this.metadataRepository.findByProjectAndType(ownerId, projectId, 'plot'),
    ]);

    const contextParts: string[] = [];
    if (narrativeMeta) {
      const text = narrativeMeta.getContentText();
      if (text) contextParts.push(`[ANALYSE NARRATIVE]\n${text}`);
    }
    if (plotMeta) {
      const text = plotMeta.getContentText();
      if (text) contextParts.push(`[INTRIGUE]\n${text}`);
    }
    if (fullText) {
      contextParts.push(`[MANUSCRIT]\n${fullText.slice(0, MANUSCRIPT_CHAR_CAP)}`);
    }

    const projectContext = contextParts.join('\n\n');

    const existingFields: Omit<CharacterProfile, 'name'> = {
      identity: character.getIdentity() ?? '',
      appearance: character.getAppearance() ?? '',
      psychology: character.getPsychology() ?? '',
      voiceAndLanguage: character.getVoiceAndLanguage() ?? '',
      backstory: character.getBackstory() ?? '',
      relationships: character.getRelationships() ?? '',
      narrativeFunction: character.getNarrativeFunction() ?? '',
      openQuestions: character.getOpenQuestions() ?? '',
    };

    return this.llmProvider.generateCharacterSheet(
      character.getName(),
      existingFields,
      projectContext,
    );
  }
}
