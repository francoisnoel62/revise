// ABOUTME: Use case for creating a new character in a project
// ABOUTME: Validates input and delegates to repository

import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateCharacterInput {
  userId: string;
  projectId: string;
  name: string;
}

export class CreateCharacterUseCase {
  constructor(
    private readonly repository: CharacterRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateCharacterInput): Promise<Character> {
    const character = Character.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.name
    );

    return this.repository.create(input.userId, character);
  }
}
