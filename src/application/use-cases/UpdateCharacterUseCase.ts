// ABOUTME: Use case for updating an existing character
// ABOUTME: Validates ownership and delegates to repository

import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

export interface UpdateCharacterInput {
  userId: string;
  characterId: string;
  name?: string;
  identity?: string;
  appearance?: string;
  psychology?: string;
  voiceAndLanguage?: string;
  backstory?: string;
  relationships?: string;
  narrativeFunction?: string;
  openQuestions?: string;
}

export class UpdateCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async execute(input: UpdateCharacterInput): Promise<Character> {
    const character = await this.repository.findById(input.userId, input.characterId);

    if (!character) {
      throw new Error('Character not found or access denied');
    }

    let updated = character;

    if (input.name !== undefined) {
      updated = updated.updateName(input.name);
    }
    if (input.identity !== undefined) {
      updated = updated.updateIdentity(input.identity);
    }
    if (input.appearance !== undefined) {
      updated = updated.updateAppearance(input.appearance);
    }
    if (input.psychology !== undefined) {
      updated = updated.updatePsychology(input.psychology);
    }
    if (input.voiceAndLanguage !== undefined) {
      updated = updated.updateVoiceAndLanguage(input.voiceAndLanguage);
    }
    if (input.backstory !== undefined) {
      updated = updated.updateBackstory(input.backstory);
    }
    if (input.relationships !== undefined) {
      updated = updated.updateRelationships(input.relationships);
    }
    if (input.narrativeFunction !== undefined) {
      updated = updated.updateNarrativeFunction(input.narrativeFunction);
    }
    if (input.openQuestions !== undefined) {
      updated = updated.updateOpenQuestions(input.openQuestions);
    }

    return this.repository.update(input.userId, updated);
  }
}
