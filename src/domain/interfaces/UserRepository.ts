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
   * @throws Error if email already exists
   */
  create(registration: UserRegistration): Promise<SafeUser>;

  /**
   * Check if email is already registered.
   */
  emailExists(email: string): Promise<boolean>;
}
