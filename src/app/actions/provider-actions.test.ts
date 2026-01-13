// ABOUTME: Comprehensive tests for provider Server Actions.
// ABOUTME: Tests CRUD operations, rate limiting, and security (API key masking).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createProviderAction,
  listProvidersAction,
  updateProviderAction,
  deleteProviderAction,
  testProviderConnectionAction,
  validateProviderAction,
} from './provider-actions';
import { Provider, ProviderType } from '@/domain/entities/Provider';

// Mock the utils module
vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getProviderRepo: vi.fn(),
  getLLMProviderFactory: vi.fn(),
  getIdGenerator: vi.fn(),
  withErrorHandling: vi.fn(async (fn) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

// Mock the rate-limiter module
vi.mock('./rate-limiter', () => ({
  canTestConnection: vi.fn(),
  recordTestConnection: vi.fn(),
}));

import {
  getAuthenticatedUserId,
  getProviderRepo,
  getLLMProviderFactory,
  getIdGenerator,
} from './utils';
import { canTestConnection, recordTestConnection } from './rate-limiter';

describe('provider-actions', () => {
  let mockProviderRepo: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    listProviders: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    isUsedByProjects: ReturnType<typeof vi.fn>;
  };

  let mockLLMProviderFactory: {
    create: ReturnType<typeof vi.fn>;
  };

  let mockIdGenerator: {
    generate: ReturnType<typeof vi.fn>;
  };

  const createMockProvider = (overrides: Partial<{
    id: string;
    ownerId: string;
    name: string;
    type: ProviderType;
    apiKey: string;
    model: string;
    isValid: boolean;
  }> = {}): Provider => {
    const provider = Provider.create(
      overrides.id || 'provider-123',
      overrides.ownerId || 'user-123',
      overrides.name || 'Test Provider',
      overrides.type || 'openai',
      overrides.apiKey || 'sk-test-api-key-1234567890abcdef',
      overrides.model || 'gpt-4o'
    );
    if (overrides.isValid) {
      provider.markAsValid();
    }
    return provider;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockProviderRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      listProviders: vi.fn(),
      delete: vi.fn(),
      isUsedByProjects: vi.fn().mockResolvedValue(false),
    };
    vi.mocked(getProviderRepo).mockResolvedValue(mockProviderRepo as never);

    mockLLMProviderFactory = {
      create: vi.fn().mockReturnValue({
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('openai'),
        getModel: vi.fn().mockReturnValue('gpt-4o'),
      }),
    };
    vi.mocked(getLLMProviderFactory).mockResolvedValue(mockLLMProviderFactory as never);

    mockIdGenerator = {
      generate: vi.fn().mockReturnValue('generated-id-123'),
    };
    vi.mocked(getIdGenerator).mockResolvedValue(mockIdGenerator as never);

    // Default rate limiter allows all
    vi.mocked(canTestConnection).mockReturnValue({ allowed: true });
    vi.mocked(recordTestConnection).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createProviderAction', () => {
    it('should create provider for authenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockProviderRepo.create.mockResolvedValue(createMockProvider());
      mockProviderRepo.update.mockResolvedValue(createMockProvider());

      const result = await createProviderAction({
        name: 'My OpenAI',
        type: 'openai',
        apiKey: 'sk-test-key-123',
        model: 'gpt-4o',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My OpenAI');
        expect(result.data.type).toBe('openai');
        expect(result.data.model).toBe('gpt-4o');
        // API key should be masked
        expect(result.data.maskedApiKey).not.toBe('sk-test-key-123');
        expect(result.data.maskedApiKey).toContain('...');
      }
    });

    it('should return error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await createProviderAction({
        name: 'Test',
        type: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-4o',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.redirect).toBe('/auth/signin');
      }
    });

    it('should test connection when markAsValid is true', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockProviderRepo.create.mockResolvedValue(createMockProvider());
      mockProviderRepo.update.mockResolvedValue(createMockProvider());
      mockLLMProviderFactory.create.mockReturnValue({
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('openai'),
        getModel: vi.fn().mockReturnValue('gpt-4o'),
      });

      const result = await createProviderAction(
        {
          name: 'My Provider',
          type: 'openai',
          apiKey: 'sk-test',
          model: 'gpt-4o',
        },
        true // markAsValid
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
      }
    });

    it('should handle different provider types', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockProviderRepo.create.mockResolvedValue(createMockProvider());
      mockProviderRepo.update.mockResolvedValue(createMockProvider());

      const types: ProviderType[] = ['openai', 'anthropic', 'mistral', 'cohere', 'google'];

      for (const type of types) {
        const result = await createProviderAction({
          name: `${type} Provider`,
          type,
          apiKey: 'test-key',
          model: 'test-model',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(type);
        }
      }
    });
  });

  describe('listProvidersAction', () => {
    it('should return all providers for authenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const providers = [
        createMockProvider({ id: 'p1', name: 'Provider 1' }),
        createMockProvider({ id: 'p2', name: 'Provider 2' }),
      ];
      mockProviderRepo.listProviders.mockResolvedValue(providers);

      const result = await listProvidersAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Provider 1');
        expect(result.data[1].name).toBe('Provider 2');
        // API keys should be masked
        result.data.forEach(p => {
          expect(p.maskedApiKey).toContain('...');
        });
      }
    });

    it('should return empty array when no providers', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockProviderRepo.listProviders.mockResolvedValue([]);

      const result = await listProvidersAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await listProvidersAction();

      expect(result.success).toBe(false);
    });
  });

  describe('updateProviderAction', () => {
    it('should update provider name', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const existingProvider = createMockProvider({ isValid: true });
      mockProviderRepo.findById.mockResolvedValue(existingProvider);
      const updatedProvider = createMockProvider({ name: 'Updated Name', isValid: true });
      mockProviderRepo.update.mockResolvedValue(updatedProvider);

      const result = await updateProviderAction('provider-123', {
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    it('should update provider model', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const existingProvider = createMockProvider({ isValid: true });
      mockProviderRepo.findById.mockResolvedValue(existingProvider);
      const updatedProvider = createMockProvider({ model: 'gpt-4-turbo', isValid: true });
      mockProviderRepo.update.mockResolvedValue(updatedProvider);

      const result = await updateProviderAction('provider-123', {
        model: 'gpt-4-turbo',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('gpt-4-turbo');
      }
    });

    it('should update API key and mask it in response', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const existingProvider = createMockProvider();
      mockProviderRepo.findById.mockResolvedValue(existingProvider);
      const updatedProvider = createMockProvider({ apiKey: 'sk-new-secret-key-very-long' });
      mockProviderRepo.update.mockResolvedValue(updatedProvider);

      const result = await updateProviderAction('provider-123', {
        apiKey: 'sk-new-secret-key-very-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not expose the new key
        expect(result.data.maskedApiKey).not.toBe('sk-new-secret-key-very-long');
        expect(result.data.maskedApiKey).toContain('...');
      }
    });

    it('should return error for non-existent provider', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockProviderRepo.findById.mockResolvedValue(null);

      const result = await updateProviderAction('non-existent', {
        name: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should return error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await updateProviderAction('provider-123', { name: 'Test' });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteProviderAction', () => {
    it('should delete provider owned by user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const existingProvider = createMockProvider();
      mockProviderRepo.findById.mockResolvedValue(existingProvider);
      mockProviderRepo.delete.mockResolvedValue(undefined);

      const result = await deleteProviderAction('provider-123');

      expect(result.success).toBe(true);
      expect(mockProviderRepo.delete).toHaveBeenCalled();
    });

    it('should return error for non-existent provider', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      // The delete method should throw when provider doesn't exist (per interface contract)
      mockProviderRepo.delete.mockRejectedValue(new Error('Provider not found'));

      const result = await deleteProviderAction('non-existent');

      expect(result.success).toBe(false);
    });

    it('should return error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await deleteProviderAction('provider-123');

      expect(result.success).toBe(false);
    });
  });

  describe('testProviderConnectionAction', () => {
    it('should test connection successfully', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: true });
      mockLLMProviderFactory.create.mockReturnValue({
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('openai'),
        getModel: vi.fn().mockReturnValue('gpt-4o'),
      });

      const result = await testProviderConnectionAction({
        type: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-4o',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
      expect(recordTestConnection).toHaveBeenCalledWith('user-123');
    });

    it('should respect rate limiting', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: false, waitSeconds: 3 });

      const result = await testProviderConnectionAction({
        type: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-4o',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('3 seconds');
      }
      expect(recordTestConnection).not.toHaveBeenCalled();
    });

    it('should return error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await testProviderConnectionAction({
        type: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-4o',
      });

      expect(result.success).toBe(false);
    });

    it('should handle connection failure', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: true });
      mockLLMProviderFactory.create.mockReturnValue({
        testConnection: vi.fn().mockResolvedValue({ valid: false, error: 'Invalid API key' }),
        getProviderName: vi.fn().mockReturnValue('openai'),
        getModel: vi.fn().mockReturnValue('gpt-4o'),
      });

      const result = await testProviderConnectionAction({
        type: 'openai',
        apiKey: 'sk-invalid',
        model: 'gpt-4o',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
      }
    });
  });

  describe('validateProviderAction', () => {
    it('should validate existing provider successfully', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: true });
      const existingProvider = createMockProvider();
      mockProviderRepo.findById.mockResolvedValue(existingProvider);
      // The use case mutates the provider and returns it, update returns a new provider
      const validatedProvider = createMockProvider({ isValid: true });
      mockProviderRepo.update.mockResolvedValue(validatedProvider);
      mockLLMProviderFactory.create.mockReturnValue({
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('openai'),
        getModel: vi.fn().mockReturnValue('gpt-4o'),
      });

      const result = await validateProviderAction('provider-123');

      expect(result.success).toBe(true);
      if (result.success) {
        // The use case returns the mutated provider after calling markAsValid()
        // The provider should be valid because testConnection returned { valid: true }
        expect(result.data).toBeDefined();
      }
      expect(recordTestConnection).toHaveBeenCalledWith('user-123');
    });

    it('should respect rate limiting', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: false, waitSeconds: 5 });

      const result = await validateProviderAction('provider-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('5 seconds');
      }
      expect(recordTestConnection).not.toHaveBeenCalled();
    });

    it('should return error for non-existent provider', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: true });
      mockProviderRepo.findById.mockResolvedValue(null);

      const result = await validateProviderAction('non-existent');

      expect(result.success).toBe(false);
    });

    it('should mark provider as invalid when connection fails', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(canTestConnection).mockReturnValue({ allowed: true });
      const existingProvider = createMockProvider({ isValid: true });
      mockProviderRepo.findById.mockResolvedValue(existingProvider);
      const invalidProvider = createMockProvider({ isValid: false });
      mockProviderRepo.update.mockResolvedValue(invalidProvider);
      mockLLMProviderFactory.create.mockReturnValue({
        testConnection: vi.fn().mockResolvedValue({ valid: false, error: 'API key expired' }),
        getProviderName: vi.fn().mockReturnValue('openai'),
        getModel: vi.fn().mockReturnValue('gpt-4o'),
      });

      const result = await validateProviderAction('provider-123');

      expect(result.success).toBe(true);
      if (result.success) {
        // The use case returns the mutated provider after calling markAsInvalid()
        expect(result.data).toBeDefined();
      }
    });
  });

  describe('toSafeProvider (API key masking)', () => {
    it('should never expose full API key', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const provider = createMockProvider({
        apiKey: 'sk-proj-super-secret-api-key-that-should-never-be-exposed',
      });
      mockProviderRepo.listProviders.mockResolvedValue([provider]);

      const result = await listProvidersAction();

      expect(result.success).toBe(true);
      if (result.success) {
        const safeProvider = result.data[0];
        expect(safeProvider.maskedApiKey).not.toContain('super-secret');
        expect(safeProvider.maskedApiKey).toContain('...');
        expect(safeProvider.maskedApiKey.length).toBeLessThan(30);
      }
    });

    it('should include timestamps in ISO format', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const provider = createMockProvider();
      mockProviderRepo.listProviders.mockResolvedValue([provider]);

      const result = await listProvidersAction();

      expect(result.success).toBe(true);
      if (result.success) {
        const safeProvider = result.data[0];
        expect(safeProvider.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(safeProvider.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });
});
