// ABOUTME: Interface for generating unique identifiers.
// ABOUTME: Abstracts ID generation to keep Domain layer pure.

/**
 * Interface for generating unique identifiers.
 * Abstracts the source of IDs to keep Domain layer framework-agnostic.
 */
export interface IdGenerator {
  /**
   * Generate a new unique identifier.
   * @returns A unique string ID (typically UUID v4)
   */
  generate(): string;
}
