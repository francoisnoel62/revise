// ABOUTME: Use case for deleting a character
// ABOUTME: Validates ownership and delegates to repository

import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

export interface DeleteCharacterInput {
  userId: string;
  characterId: string;
}

export class DeleteCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async execute(input: DeleteCharacterInput): Promise<void> {
    await this.repository.delete(input.userId, input.characterId);
  }
}
