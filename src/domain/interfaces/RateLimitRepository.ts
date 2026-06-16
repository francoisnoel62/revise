// ABOUTME: Repository interface for a shared, cross-instance rate limiter
// ABOUTME: Backed by a store (MongoDB) so limits hold across serverless instances

export interface RateLimitResult {
  /** Whether this hit is within budget for the current window. */
  allowed: boolean;
  /** When blocked, seconds until the current window resets. */
  retryAfterSeconds?: number;
}

/**
 * Fixed-window rate limiting backed by a shared store.
 *
 * In-memory limiters are useless on serverless (each instance counts alone and
 * resets on cold start), so high-frequency abuse vectors must use this instead.
 */
export interface RateLimitRepository {
  /**
   * Account for one hit against `key` and report whether it is within budget.
   * Hits are bucketed into fixed windows of `windowMs`; at most `maxPerWindow`
   * hits are allowed per window. The store prunes expired windows on its own.
   */
  consumeFixedWindow(
    key: string,
    windowMs: number,
    maxPerWindow: number
  ): Promise<RateLimitResult>;
}
