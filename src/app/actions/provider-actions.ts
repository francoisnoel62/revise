// ABOUTME: Server Actions for AI Provider CRUD operations.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { Provider, ProviderType } from '@/domain/entities/Provider';
import { CreateProviderUseCase } from '@/application/use-cases/CreateProviderUseCase';
import { UpdateProviderUseCase } from '@/application/use-cases/UpdateProviderUseCase';
import { DeleteProviderUseCase } from '@/application/use-cases/DeleteProviderUseCase';
import { ListProvidersUseCase } from '@/application/use-cases/ListProvidersUseCase';
import { TestProviderConnectionUseCase } from '@/application/use-cases/TestProviderConnectionUseCase';
import { ValidateProviderUseCase } from '@/application/use-cases/ValidateProviderUseCase';
import { maskApiKey } from '@/infrastructure/encryption/crypto';
import {
  ActionResult,
  getAuthenticatedUserId,
  withErrorHandling,
  getProviderRepo,
  getLLMProviderFactory,
  getIdGenerator,
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
 * Delegates to CreateProviderUseCase for business logic.
 *
 * @param data Provider creation data
 * @param markAsValid If true, tests connection and marks valid if successful
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
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new CreateProviderUseCase(
      await getProviderRepo(),
      getLLMProviderFactory(),
      getIdGenerator()
    );

    const provider = await useCase.execute({
      ownerId: auth.userId,
      name: data.name,
      type: data.type,
      apiKey: data.apiKey,
      model: data.model,
      testConnection: markAsValid,
    });

    return toSafeProvider(provider);
  });
}

/**
 * List all providers for the current user.
 * Delegates to ListProvidersUseCase.
 *
 * @returns Action result with array of SafeProvider or error
 */
export async function listProvidersAction(): Promise<ActionResult<SafeProvider[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ListProvidersUseCase(await getProviderRepo());
    const providers = await useCase.execute({ userId: auth.userId });
    return providers.map(toSafeProvider);
  });
}

/**
 * Update an existing provider.
 * Delegates to UpdateProviderUseCase for business logic.
 *
 * @param providerId The provider ID to update
 * @param updates Partial updates to apply
 * @param markAsValid If true, tests connection and marks valid if successful
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
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new UpdateProviderUseCase(
      await getProviderRepo(),
      getLLMProviderFactory()
    );

    const provider = await useCase.execute({
      userId: auth.userId,
      providerId,
      ...updates,
      testConnection: markAsValid,
    });

    return toSafeProvider(provider);
  });
}

/**
 * Delete a provider.
 * Delegates to DeleteProviderUseCase for business logic.
 *
 * IMPORTANT: Business rule enforced by Use Case - blocks deletion if provider is used by projects.
 *
 * @param providerId The provider ID to delete
 * @returns Action result with void or error
 */
export async function deleteProviderAction(
  providerId: string
): Promise<ActionResult<void>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new DeleteProviderUseCase(await getProviderRepo());
    await useCase.execute({
      userId: auth.userId,
      providerId,
    });
  });
}

/**
 * Test connection to a provider.
 * Rate limited to 1 test per 5 seconds per user.
 * Delegates to TestProviderConnectionUseCase for business logic.
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
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  // Rate limiting (infrastructure concern, stays in Server Action)
  const rateLimitCheck = canTestConnection(auth.userId);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Please wait ${rateLimitCheck.waitSeconds} seconds before testing again`,
    };
  }

  return withErrorHandling(async () => {
    recordTestConnection(auth.userId);

    const useCase = new TestProviderConnectionUseCase(
      getLLMProviderFactory(),
      getIdGenerator()
    );
    return useCase.execute({
      userId: auth.userId,
      type: data.type,
      apiKey: data.apiKey,
      model: data.model,
    });
  });
}

/**
 * Validate an existing provider by testing its connection.
 * Updates the provider's isValid status in the database.
 * Rate limited to 1 test per 5 seconds per user.
 * Delegates to ValidateProviderUseCase for business logic.
 *
 * @param providerId The provider ID to validate
 * @returns Action result with validation result or error
 */
export async function validateProviderAction(
  providerId: string
): Promise<ActionResult<SafeProvider>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  // Rate limiting (infrastructure concern, stays in Server Action)
  const rateLimitCheck = canTestConnection(auth.userId);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Please wait ${rateLimitCheck.waitSeconds} seconds before testing again`,
    };
  }

  return withErrorHandling(async () => {
    recordTestConnection(auth.userId);

    const useCase = new ValidateProviderUseCase(
      await getProviderRepo(),
      getLLMProviderFactory()
    );

    const provider = await useCase.execute({
      userId: auth.userId,
      providerId,
    });

    return toSafeProvider(provider);
  });
}
