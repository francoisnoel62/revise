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
}
