// ABOUTME: Simple in-memory rate limiter for test connection endpoint.
// ABOUTME: Prevents abuse with 5-second cooldown per user.

/**
 * Simple in-memory rate limiter for test connection endpoint.
 *
 * NOTE: This is a simple Map-based implementation suitable for single-server deployments.
 * For production with multiple servers, consider Redis-based rate limiting.
 */

const testConnectionLimits = new Map<string, number>();
const TEST_COOLDOWN_MS = 5000; // 5 seconds

/**
 * Check if user can perform a test connection now.
 *
 * @param userId The user ID to check
 * @returns Object with allowed flag and optional wait time
 */
export function canTestConnection(userId: string): {
  allowed: boolean;
  waitSeconds?: number;
} {
  const lastTest = testConnectionLimits.get(userId);

  if (!lastTest) {
    return { allowed: true };
  }

  const now = Date.now();
  const elapsed = now - lastTest;

  if (elapsed < TEST_COOLDOWN_MS) {
    const waitMs = TEST_COOLDOWN_MS - elapsed;
    const waitSeconds = Math.ceil(waitMs / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

/**
 * Record a test connection attempt.
 *
 * @param userId The user ID performing the test
 */
export function recordTestConnection(userId: string): void {
  testConnectionLimits.set(userId, Date.now());
}

/**
 * Clean up old entries (optional, for memory management).
 * Call this periodically in production.
 */
export function cleanupOldEntries(): void {
  const now = Date.now();
  const expiry = TEST_COOLDOWN_MS * 2; // Keep 2x cooldown period

  for (const [userId, timestamp] of testConnectionLimits.entries()) {
    if (now - timestamp > expiry) {
      testConnectionLimits.delete(userId);
    }
  }
}
