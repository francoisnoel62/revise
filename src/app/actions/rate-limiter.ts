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

/**
 * Rate limiting for metadata generation.
 * Prevents API abuse by limiting generation frequency per metadata type.
 */

const metadataGenerationLimits = new Map<string, Map<string, number>>();
const METADATA_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Check if user can generate metadata for a specific type now.
 *
 * @param userId The user ID to check
 * @param metadataType The metadata type (e.g., 'narrative-analysis', 'stylistic-dna')
 * @returns Object with allowed flag and optional wait time
 */
export function canGenerateMetadata(
  userId: string,
  metadataType: string
): {
  allowed: boolean;
  waitSeconds?: number;
} {
  const userLimits = metadataGenerationLimits.get(userId);

  if (!userLimits) {
    return { allowed: true };
  }

  const lastGeneration = userLimits.get(metadataType);

  if (!lastGeneration) {
    return { allowed: true };
  }

  const now = Date.now();
  const elapsed = now - lastGeneration;

  if (elapsed < METADATA_COOLDOWN_MS) {
    const waitMs = METADATA_COOLDOWN_MS - elapsed;
    const waitSeconds = Math.ceil(waitMs / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

/**
 * Record a metadata generation attempt.
 *
 * @param userId The user ID performing the generation
 * @param metadataType The metadata type being generated
 */
export function recordMetadataGeneration(userId: string, metadataType: string): void {
  let userLimits = metadataGenerationLimits.get(userId);

  if (!userLimits) {
    userLimits = new Map();
    metadataGenerationLimits.set(userId, userLimits);
  }

  userLimits.set(metadataType, Date.now());
}

/**
 * Clean up old metadata generation entries (optional, for memory management).
 * Call this periodically in production.
 */
export function cleanupMetadataGenerationEntries(): void {
  const now = Date.now();
  const expiry = METADATA_COOLDOWN_MS * 2; // Keep 2x cooldown period

  for (const [userId, userLimits] of metadataGenerationLimits.entries()) {
    for (const [metadataType, timestamp] of userLimits.entries()) {
      if (now - timestamp > expiry) {
        userLimits.delete(metadataType);
      }
    }

    // Remove user entry if no types remain
    if (userLimits.size === 0) {
      metadataGenerationLimits.delete(userId);
    }
  }
}

/**
 * Rate limiting for long chapter generation.
 * Kept separate from metadata generation so product decisions can tune/remove
 * chapter generation without changing metadata analysis cooldowns.
 */

const chapterGenerationLimits = new Map<string, Map<string, number>>();
const CHAPTER_GENERATION_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Check if user can generate chapter content for a specific type now.
 *
 * @param userId The user ID to check
 * @param generationType The generation type (e.g., 'chapter-beginning')
 * @returns Object with allowed flag and optional wait time
 */
export function canGenerateChapter(
  userId: string,
  generationType: string
): {
  allowed: boolean;
  waitSeconds?: number;
} {
  const userLimits = chapterGenerationLimits.get(userId);

  if (!userLimits) {
    return { allowed: true };
  }

  const lastGeneration = userLimits.get(generationType);

  if (!lastGeneration) {
    return { allowed: true };
  }

  const now = Date.now();
  const elapsed = now - lastGeneration;

  if (elapsed < CHAPTER_GENERATION_COOLDOWN_MS) {
    const waitMs = CHAPTER_GENERATION_COOLDOWN_MS - elapsed;
    const waitSeconds = Math.ceil(waitMs / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

/**
 * Record a chapter generation attempt.
 *
 * @param userId The user ID performing the generation
 * @param generationType The chapter generation type being generated
 */
export function recordChapterGeneration(userId: string, generationType: string): void {
  let userLimits = chapterGenerationLimits.get(userId);

  if (!userLimits) {
    userLimits = new Map();
    chapterGenerationLimits.set(userId, userLimits);
  }

  userLimits.set(generationType, Date.now());
}

/**
 * Clean up old chapter generation entries (optional, for memory management).
 * Call this periodically in production.
 */
export function cleanupChapterGenerationEntries(): void {
  const now = Date.now();
  const expiry = CHAPTER_GENERATION_COOLDOWN_MS * 2; // Keep 2x cooldown period

  for (const [userId, userLimits] of chapterGenerationLimits.entries()) {
    for (const [generationType, timestamp] of userLimits.entries()) {
      if (now - timestamp > expiry) {
        userLimits.delete(generationType);
      }
    }

    if (userLimits.size === 0) {
      chapterGenerationLimits.delete(userId);
    }
  }
}
