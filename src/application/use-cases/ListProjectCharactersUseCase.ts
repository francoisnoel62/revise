// ABOUTME: Use case for listing all characters in a project
// ABOUTME: Returns characters sorted alphabetically by name

import { Character } from '@/domain/entities/Character';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';

export interface ListProjectCharactersInput {
  userId: string;
  projectId: string;
}

export class ListProjectCharactersUseCase {
  constructor(private readonly repository: CharacterRepository) {}

  async execute(input: ListProjectCharactersInput): Promise<Character[]> {
    return this.repository.findByProjectId(input.userId, input.projectId);
  }
}
