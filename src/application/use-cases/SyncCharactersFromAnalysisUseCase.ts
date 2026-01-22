// ABOUTME: Use case for syncing characters from AI-generated character analysis
// ABOUTME: Creates new characters or updates existing ones from CharacterProfile data

import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { CharacterProfile } from '@/domain/value-objects/Characters';

export interface SyncCharactersFromAnalysisInput {
  userId: string;
  projectId: string;
  characterProfiles: CharacterProfile[];
}

export interface SyncResult {
  created: Character[];
  updated: Character[];
  skipped: string[];
}

export class SyncCharactersFromAnalysisUseCase {
  constructor(
    private readonly repository: CharacterRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: SyncCharactersFromAnalysisInput): Promise<SyncResult> {
    const existingCharacters = await this.repository.findByProjectId(
      input.userId,
      input.projectId
    );

    const existingByName = new Map<string, Character>();
    for (const char of existingCharacters) {
      existingByName.set(char.getName().toLowerCase(), char);
    }

    const created: Character[] = [];
    const updated: Character[] = [];
    const skipped: string[] = [];

    for (const profile of input.characterProfiles) {
      const normalizedName = profile.name.toLowerCase();
      const existing = existingByName.get(normalizedName);

      if (existing) {
        // Update existing character with AI-generated data
        const updatedChar = existing
          .updateIdentity(profile.identity)
          .updateAppearance(profile.appearance)
          .updatePsychology(profile.psychology)
          .updateVoiceAndLanguage(profile.voiceAndLanguage)
          .updateBackstory(profile.backstory)
          .updateRelationships(profile.relationships)
          .updateNarrativeFunction(profile.narrativeFunction)
          .updateOpenQuestions(profile.openQuestions);

        await this.repository.update(input.userId, updatedChar);
        updated.push(updatedChar);
      } else {
        // Create new character from AI-generated profile
        try {
          const newChar = Character.create(
            this.idGenerator.generate(),
            input.projectId,
            input.userId,
            profile.name
          )
            .updateIdentity(profile.identity)
            .updateAppearance(profile.appearance)
            .updatePsychology(profile.psychology)
            .updateVoiceAndLanguage(profile.voiceAndLanguage)
            .updateBackstory(profile.backstory)
            .updateRelationships(profile.relationships)
            .updateNarrativeFunction(profile.narrativeFunction)
            .updateOpenQuestions(profile.openQuestions);

          await this.repository.create(input.userId, newChar);
          created.push(newChar);
        } catch {
          // Skip invalid character names (empty after trim, etc.)
          skipped.push(profile.name);
        }
      }
    }

    return { created, updated, skipped };
  }
}
