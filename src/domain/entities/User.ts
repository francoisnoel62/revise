// ABOUTME: User entity for authentication.
// ABOUTME: Stores credentials and basic profile information.

/**
 * User entity for authentication.
 * Passwords are hashed before storage - never store plain text.
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  isApproved: boolean;
  isAdmin: boolean;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data for registration (password not yet hashed).
 */
export interface UserRegistration {
  email: string;
  password: string;
  name?: string;
}

/**
 * User data safe for client exposure (no password).
 */
export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  isApproved: boolean;
  isAdmin: boolean;
}
