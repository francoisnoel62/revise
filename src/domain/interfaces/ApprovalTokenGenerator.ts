// ABOUTME: Interface for generating secure approval tokens.
// ABOUTME: Used to create tamper-proof links for user approval/rejection.

export interface ApprovalTokenGenerator {
  /**
   * Generate a secure token for a user ID.
   * The token should be deterministic (same input = same output).
   */
  generateToken(userId: string): string;

  /**
   * Verify if a token is valid for a given user ID.
   */
  verifyToken(userId: string, token: string): boolean;
}
