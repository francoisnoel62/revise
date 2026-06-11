// ABOUTME: Repository interface for User persistence.

import { User, UserRegistration, SafeUser } from '../entities/User';

export type { SafeUser };

export interface UserRepository {
  /**
   * Find user by email address.
   * Used for login verification.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Create a new user.
   * New users are created with isApproved=false by default.
   * @throws Error if email already exists
   */
  create(registration: UserRegistration): Promise<SafeUser>;

  /**
   * Check if email is already registered.
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Approve a user, allowing them to sign in.
   * @returns true if user was approved, false if user not found
   */
  approveUser(userId: string): Promise<boolean>;

  /**
   * Delete a user (used for rejection).
   * @returns true if user was deleted, false if user not found
   */
  deleteUser(userId: string): Promise<boolean>;

  /**
   * Update a user's password.
   * The new password should already be hashed.
   * @returns true if password was updated, false if user not found
   */
  updatePassword(userId: string, newPasswordHash: string): Promise<boolean>;

  /**
   * Verify a password against a hash.
   * @returns true if password matches
   */
  verifyPassword(password: string, hash: string): Promise<boolean>;

  /**
   * Hash a password for storage.
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Update the user's AI exchange logging preferences (transparency ledger).
   * @returns true if the user was updated, false if not found
   */
  updateAIExchangeLogging(
    userId: string,
    enabled: boolean,
    retentionDays: number
  ): Promise<boolean>;
}
