// ABOUTME: Repository interface for Provider entity persistence.
// ABOUTME: All methods enforce multi-tenant isolation by filtering on userId/ownerId.

import { Provider } from '../entities/Provider';

/**
 * Repository interface for Provider entity persistence.
 *
 * CRITICAL SECURITY: All methods MUST enforce multi-tenant isolation
 * by filtering on userId/ownerId. Never expose data across tenants.
 */
export interface ProviderRepository {
  /**
   * Create a new provider.
   *
   * @param userId The user creating the provider (must match provider.getOwnerId())
   * @param provider The provider to create
   * @returns The created provider
   * @throws Error if ownerId mismatch or creation fails
   */
  create(userId: string, provider: Provider): Promise<Provider>;

  /**
   * Find a provider by ID.
   *
   * @param userId The user requesting the provider (multi-tenant filter)
   * @param providerId The provider ID to find
   * @returns The provider if found and owned by user, null otherwise
   */
  findById(userId: string, providerId: string): Promise<Provider | null>;

  /**
   * List all providers for a user.
   *
   * @param userId The user whose providers to list
   * @returns Array of providers owned by the user (sorted by createdAt DESC)
   */
  listProviders(userId: string): Promise<Provider[]>;

  /**
   * Update an existing provider.
   *
   * @param userId The user updating the provider (must be owner)
   * @param provider The updated provider
   * @returns The updated provider
   * @throws Error if provider not found or not owned by user
   */
  update(userId: string, provider: Provider): Promise<Provider>;

  /**
   * Delete a provider.
   *
   * @param userId The user deleting the provider (must be owner)
   * @param providerId The provider ID to delete
   * @throws Error if provider not found or not owned by user
   */
  delete(userId: string, providerId: string): Promise<void>;

  /**
   * Check if a provider is used by any projects.
   *
   * @param userId The user checking usage (must be owner)
   * @param providerId The provider ID to check
   * @returns True if provider is used by at least one project
   */
  isUsedByProjects(userId: string, providerId: string): Promise<boolean>;
}
