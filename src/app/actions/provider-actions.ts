// ABOUTME: Server Actions for AI Provider CRUD operations.
// ABOUTME: All operations require authentication and use encrypted MongoDB persistence.

'use server';

import { Provider, ProviderType } from '@/domain/entities/Provider';
import { getProviderRepository, createLLMProvider } from '@/infrastructure/config/providers';
import { maskApiKey } from '@/infrastructure/encryption/crypto';
import {
  ActionResult,
  getAuthenticatedUserId,
  withErrorHandling,
} from './utils';
import { canTestConnection, recordTestConnection } from './rate-limiter';

/**
 * Client-safe provider data transfer object.
 * NEVER contains plain-text API keys.
 */
export interface SafeProvider {
  id: string;
  name: string;
  type: ProviderType;
  maskedApiKey: string; // e.g., "sk-proj-...abc123"
  model: string;
  isValid: boolean;
  lastTested?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Convert Provider entity to SafeProvider DTO.
 * Masks the API key to prevent exposure to client.
 */
function toSafeProvider(provider: Provider): SafeProvider {
  return {
    id: provider.getId(),
    name: provider.getName(),
    type: provider.getType(),
    maskedApiKey: maskApiKey(provider.getApiKey()),
    model: provider.getModel(),
    isValid: provider.isValidProvider(),
    lastTested: provider.getLastTested()?.toISOString(),
    createdAt: provider.getCreatedAt().toISOString(),
    updatedAt: provider.getUpdatedAt().toISOString(),
  };
}

/**
 * Create a new provider.
 *
 * @param data Provider creation data
 * @param markAsValid If true, marks the provider as valid immediately (bypasses validation)
 * @returns Action result with SafeProvider or error
 */
export async function createProviderAction(
  data: {
    name: string;
    type: ProviderType;
    apiKey: string;
    model: string;
  },
  markAsValid?: boolean
): Promise<ActionResult<SafeProvider>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Validate input
  if (!data.name || data.name.trim().length === 0) {
    return { success: false, error: 'Provider name is required' };
  }

  if (!data.apiKey || data.apiKey.trim().length === 0) {
    return { success: false, error: 'API key is required' };
  }

  if (!data.model || data.model.trim().length === 0) {
    return { success: false, error: 'Model is required' };
  }

  // Valid provider types
  const validTypes: ProviderType[] = ['openai', 'anthropic', 'mistral', 'cohere', 'google'];
  if (!validTypes.includes(data.type)) {
    return { success: false, error: 'Invalid provider type' };
  }

  return withErrorHandling(async () => {
    // 3. Get repository
    const providerRepo = await getProviderRepository();

    // 4. Create provider entity
    const provider = Provider.create(
      userId,
      data.name.trim(),
      data.type,
      data.apiKey.trim(),
      data.model.trim()
    );

    // 5. Mark as valid if requested (e.g., after successful test connection)
    if (markAsValid) {
      provider.markAsValid();
    }

    // 6. Persist to database (encrypted)
    await providerRepo.create(userId, provider);

    // 7. Return safe version
    return toSafeProvider(provider);
  });
}

/**
 * List all providers for the current user.
 *
 * @returns Action result with array of SafeProvider or error
 */
export async function listProvidersAction(): Promise<ActionResult<SafeProvider[]>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  return withErrorHandling(async () => {
    // 2. Get repository
    const providerRepo = await getProviderRepository();

    // 3. List providers (multi-tenant filtered)
    const providers = await providerRepo.listProviders(userId);

    // 4. Convert to safe versions
    return providers.map(toSafeProvider);
  });
}

/**
 * Update an existing provider.
 *
 * @param providerId The provider ID to update
 * @param updates Partial updates to apply
 * @param markAsValid If true, marks the provider as valid immediately (bypasses validation)
 * @returns Action result with updated SafeProvider or error
 */
export async function updateProviderAction(
  providerId: string,
  updates: {
    name?: string;
    apiKey?: string;
    model?: string;
  },
  markAsValid?: boolean
): Promise<ActionResult<SafeProvider>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Validate provider ID
  if (!providerId) {
    return { success: false, error: 'Provider ID is required' };
  }

  return withErrorHandling(async () => {
    // 3. Get repository
    const providerRepo = await getProviderRepository();

    // 4. Load existing provider
    const provider = await providerRepo.findById(userId, providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    // 5. Apply updates
    if (updates.name !== undefined) {
      provider.updateName(updates.name);
    }
    if (updates.apiKey !== undefined) {
      provider.updateApiKey(updates.apiKey);
    }
    if (updates.model !== undefined) {
      provider.updateModel(updates.model);
    }

    // 6. Mark as valid if requested (e.g., after successful test connection)
    if (markAsValid) {
      provider.markAsValid();
    }

    // 7. Persist changes
    await providerRepo.update(userId, provider);

    // 8. Return safe version
    return toSafeProvider(provider);
  });
}

/**
 * Delete a provider.
 *
 * IMPORTANT: This enforces Phase 1 Decision - Block deletion if provider is used by projects.
 *
 * @param providerId The provider ID to delete
 * @returns Action result with void or error
 */
export async function deleteProviderAction(
  providerId: string
): Promise<ActionResult<void>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Validate provider ID
  if (!providerId) {
    return { success: false, error: 'Provider ID is required' };
  }

  return withErrorHandling(async () => {
    // 3. Get repository
    const providerRepo = await getProviderRepository();

    // 4. Check if provider is used by projects
    const isUsed = await providerRepo.isUsedByProjects(userId, providerId);

    if (isUsed) {
      throw new Error(
        'Cannot delete provider that is used by projects. Please change the provider for those projects first.'
      );
    }

    // 5. Delete provider
    await providerRepo.delete(userId, providerId);
  });
}

/**
 * Test connection to a provider.
 * Rate limited to 1 test per 5 seconds per user.
 *
 * @param data Provider credentials to test
 * @returns Action result with test result or error
 */
export async function testProviderConnectionAction(data: {
  type: ProviderType;
  apiKey: string;
  model: string;
}): Promise<
  ActionResult<{
    valid: boolean;
    message: string;
  }>
> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Rate limiting
  const rateLimitCheck = canTestConnection(userId);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Please wait ${rateLimitCheck.waitSeconds} seconds before testing again`,
    };
  }

  // 3. Validate input
  if (!data.apiKey || data.apiKey.trim().length === 0) {
    return { success: false, error: 'API key is required' };
  }

  if (!data.model || data.model.trim().length === 0) {
    return { success: false, error: 'Model is required' };
  }

  return withErrorHandling(async () => {
    // 4. Record test attempt (rate limiting)
    recordTestConnection(userId);

    // 5. Create temporary provider entity
    const tempProvider = Provider.create(
      userId,
      'Test Provider',
      data.type,
      data.apiKey.trim(),
      data.model.trim()
    );

    // 6. Create LLM provider instance
    const llmProvider = createLLMProvider(tempProvider);

    // 7. Test connection
    const result = await llmProvider.testConnection();

    // 8. Return result
    return {
      valid: result.valid,
      message: result.valid
        ? 'Connection successful'
        : result.error || 'Connection failed',
    };
  });
}

/**
 * Validate an existing provider by testing its connection.
 * Updates the provider's isValid status in the database.
 * Rate limited to 1 test per 5 seconds per user.
 *
 * @param providerId The provider ID to validate
 * @returns Action result with validation result or error
 */
export async function validateProviderAction(
  providerId: string
): Promise<ActionResult<SafeProvider>> {
  // 1. Authenticate
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth.error;
  }
  const { userId } = auth;

  // 2. Rate limiting
  const rateLimitCheck = canTestConnection(userId);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Please wait ${rateLimitCheck.waitSeconds} seconds before testing again`,
    };
  }

  // 3. Validate provider ID
  if (!providerId) {
    return { success: false, error: 'Provider ID is required' };
  }

  return withErrorHandling(async () => {
    // 4. Record test attempt (rate limiting)
    recordTestConnection(userId);

    // 5. Get repository
    const providerRepo = await getProviderRepository();

    // 6. Load existing provider
    const provider = await providerRepo.findById(userId, providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    // 7. Create LLM provider instance
    const llmProvider = createLLMProvider(provider);

    // 8. Test connection
    const result = await llmProvider.testConnection();

    // 9. Update validation status
    if (result.valid) {
      provider.markAsValid();
    } else {
      provider.markAsInvalid();
    }

    // 10. Persist changes
    await providerRepo.update(userId, provider);

    // 11. Return updated safe provider
    return toSafeProvider(provider);
  });
}
