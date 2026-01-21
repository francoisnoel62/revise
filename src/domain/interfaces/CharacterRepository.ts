// ABOUTME: Repository interface for Character persistence
// ABOUTME: Defines contract for storing and retrieving character entities with multi-tenant isolation

import { Character } from '../entities/Character';

export interface CharacterRepository {
  /**
   * Create a new character.
   * @param userId - Owner ID for multi-tenant isolation
   * @param character - Character entity to persist
   * @returns Created character
   */
  create(userId: string, character: Character): Promise<Character>;

  /**
   * Find a character by ID.
   * @param userId - Owner ID for multi-tenant isolation
   * @param characterId - Character ID to find
   * @returns Character if found and owned by user, null otherwise
   */
  findById(userId: string, characterId: string): Promise<Character | null>;

  /**
   * Find all characters for a project.
   * @param userId - Owner ID for multi-tenant isolation
   * @param projectId - Project ID to filter by
   * @returns Array of characters for the project
   */
  findByProjectId(userId: string, projectId: string): Promise<Character[]>;

  /**
   * Update an existing character.
   * @param userId - Owner ID for multi-tenant isolation
   * @param character - Character entity with updated data
   * @returns Updated character
   */
  update(userId: string, character: Character): Promise<Character>;

  /**
   * Delete a character.
   * @param userId - Owner ID for multi-tenant isolation
   * @param characterId - Character ID to delete
   */
  delete(userId: string, characterId: string): Promise<void>;

  /**
   * Delete all characters for a project.
   * Used when deleting a project.
   * @param userId - Owner ID for multi-tenant isolation
   * @param projectId - Project ID
   */
  deleteByProjectId(userId: string, projectId: string): Promise<void>;

  /**
   * Delete all characters owned by a user.
   * Used for RGPD-compliant account deletion.
   * @param userId - Owner ID
   */
  deleteAllByOwner(userId: string): Promise<void>;

  /**
   * Count characters for a project.
   * @param userId - Owner ID for multi-tenant isolation
   * @param projectId - Project ID
   * @returns Number of characters
   */
  countByProjectId(userId: string, projectId: string): Promise<number>;
}
