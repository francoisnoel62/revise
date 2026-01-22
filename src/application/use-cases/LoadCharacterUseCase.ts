// ABOUTME: Use case for loading a single character by ID
// ABOUTME: Validates ownership and returns character or null

import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

export interface LoadCharacterInput {
  userId: string;
  characterId: string;
}

export class LoadCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async execute(input: LoadCharacterInput): Promise<Character | null> {
    return this.repository.findById(input.userId, input.characterId);
  }
}
