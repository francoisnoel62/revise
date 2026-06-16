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

// ---------------------------------------------------------------------------
// Canon-fact generation rate limiting (independent namespace + cooldown).
// ---------------------------------------------------------------------------

const canonFactsGenerationLimits = new Map<string, Map<string, number>>();
const CANON_FACTS_COOLDOWN_MS = 30000; // 30 seconds per project

/**
 * Check if a user can (re)generate canon facts for a project now.
 *
 * The cooldown is scoped per project so generating facts on one project does not
 * block generation on the user's other projects.
 *
 * @param userId The user ID to check
 * @param projectId The project whose canon facts would be (re)generated
 * @returns Object with allowed flag and optional wait time
 */
export function canGenerateCanonFacts(
  userId: string,
  projectId: string
): {
  allowed: boolean;
  waitSeconds?: number;
} {
  const userLimits = canonFactsGenerationLimits.get(userId);
  if (!userLimits) {
    return { allowed: true };
  }

  const lastGeneration = userLimits.get(projectId);
  if (!lastGeneration) {
    return { allowed: true };
  }

  const elapsed = Date.now() - lastGeneration;
  if (elapsed < CANON_FACTS_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((CANON_FACTS_COOLDOWN_MS - elapsed) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

/**
 * Record a canon-fact generation attempt.
 *
 * @param userId The user ID performing the generation
 * @param projectId The project whose canon facts were generated
 */
export function recordCanonFactsGeneration(userId: string, projectId: string): void {
  let userLimits = canonFactsGenerationLimits.get(userId);
  if (!userLimits) {
    userLimits = new Map();
    canonFactsGenerationLimits.set(userId, userLimits);
  }

  userLimits.set(projectId, Date.now());
}

// Telemetry ingestion is rate-limited via the shared RateLimitRepository (see
// the telemetry route): an in-memory limiter is useless on serverless because
// each instance counts alone and resets on cold start.
