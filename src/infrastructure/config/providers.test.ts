// ABOUTME: Unit tests for provider factory functions.

import { describe, it, expect, vi } from 'vitest';

// Mock Auth.js to avoid module resolution issues in tests
vi.mock('next-auth', () => ({
  default: vi.fn(),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(),
}));

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

// Mock OpenAI SDK to avoid browser environment check
vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: vi.fn(),
      },
    };
    models = {
      list: vi.fn(),
    };
  },
}));

// Mock Anthropic SDK to avoid browser environment check
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn(),
    };
  },
}));

// Mock Google Generative AI SDK to avoid browser environment check
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: vi.fn(),
        generateContentStream: vi.fn(),
      };
    }
  },
}));

import { getAuthProvider, getProjectRepository, createLLMProvider } from './providers';
import { AuthJsProvider } from '@/infrastructure/auth/AuthJsProvider';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { AnthropicProvider } from '@/infrastructure/ai/AnthropicProvider';
import { GoogleProvider } from '@/infrastructure/ai/GoogleProvider';
import { Provider } from '@/domain/entities/Provider';

describe('providers', () => {
  describe('getAuthProvider', () => {
    it('returns AuthJsProvider instance', () => {
      const provider = getAuthProvider();

      expect(provider).toBeInstanceOf(AuthJsProvider);
    });
  });

  describe('getProjectRepository', () => {
    it('returns InMemoryProjectRepository instance (Phase 3.0)', async () => {
      const repository = await getProjectRepository();

      expect(repository).toBeInstanceOf(InMemoryProjectRepository);
    });
  });

  describe('createLLMProvider', () => {
    it('creates OpenAIProvider for openai type', () => {
      const provider = Provider.create(
        'test-id',
        'user-123',
        'Test OpenAI',
        'openai',
        'sk-test-key',
        'gpt-4o'
      );

      const llmProvider = createLLMProvider(provider);

      expect(llmProvider).toBeInstanceOf(OpenAIProvider);
      expect(llmProvider.getProviderName()).toBe('OpenAI');
      expect(llmProvider.getModel()).toBe('gpt-4o');
    });

    it('creates AnthropicProvider for anthropic type', () => {
      const provider = Provider.create(
        'test-id',
        'user-123',
        'Test Anthropic',
        'anthropic',
        'sk-ant-test-key',
        'claude-sonnet-4-5-20250929'
      );

      const llmProvider = createLLMProvider(provider);

      expect(llmProvider).toBeInstanceOf(AnthropicProvider);
      expect(llmProvider.getProviderName()).toBe('Anthropic');
      expect(llmProvider.getModel()).toBe('claude-sonnet-4-5-20250929');
    });

    it('creates GoogleProvider for google type', () => {
      const provider = Provider.create(
        'test-id',
        'user-123',
        'Test Google',
        'google',
        'AIza-test-key',
        'gemini-3-flash'
      );

      const llmProvider = createLLMProvider(provider);

      expect(llmProvider).toBeInstanceOf(GoogleProvider);
      expect(llmProvider.getProviderName()).toBe('Google AI');
      expect(llmProvider.getModel()).toBe('gemini-3-flash');
    });

    it('throws error for unsupported provider type', () => {
      // Create a provider and manually override its type to test error handling
      const provider = Provider.create(
        'test-id',
        'user-123',
        'Test Unknown',
        'openai', // Valid type to pass creation
        'test-key',
        'test-model'
      );

      // Override getType to return an invalid type
      vi.spyOn(provider, 'getType').mockReturnValue('invalid' as never);

      expect(() => createLLMProvider(provider)).toThrow('Unsupported provider type: invalid');
    });
  });
});
