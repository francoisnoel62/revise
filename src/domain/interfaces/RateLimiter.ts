// ABOUTME: Interface for rate limiting operations.
// ABOUTME: Abstracts rate limiting to allow different implementations (in-memory, Redis, etc).

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetInSeconds: number;
}

export interface RateLimiter {
  /**
   * Check if an action is allowed for the given identifier.
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param action - The action being rate limited (e.g., 'registration', 'login')
   * @returns Result indicating if the action is allowed and remaining attempts
   */
  checkLimit(identifier: string, action: string): Promise<RateLimitResult>;

  /**
   * Record an attempt for the given identifier and action.
   * @param identifier - Unique identifier
   * @param action - The action being rate limited
   */
  recordAttempt(identifier: string, action: string): Promise<void>;

  /**
   * Reset the rate limit for a given identifier and action.
   * @param identifier - Unique identifier
   * @param action - The action being rate limited
   */
  resetLimit(identifier: string, action: string): Promise<void>;
}
