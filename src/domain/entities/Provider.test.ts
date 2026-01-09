import { describe, it, expect } from 'vitest';
import { Provider } from './Provider';

describe('Provider Entity', () => {
  const validData = {
    id: 'provider-123',
    ownerId: 'user-123',
    name: 'OpenAI Production',
    type: 'openai' as const,
    apiKey: 'sk-test-key',
    model: 'gpt-4o-mini',
  };

  describe('create', () => {
    it('should create a new provider with valid data', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        validData.name,
        validData.type,
        validData.apiKey,
        validData.model
      );

      expect(provider.getId()).toBe(validData.id);
      expect(provider.getOwnerId()).toBe(validData.ownerId);
      expect(provider.getName()).toBe(validData.name);
      expect(provider.getType()).toBe(validData.type);
      expect(provider.getApiKey()).toBe(validData.apiKey);
      expect(provider.getModel()).toBe(validData.model);
      expect(provider.isValidProvider()).toBe(false);
      expect(provider.getLastTested()).toBeUndefined();
    });
  });

  describe('constructor validation', () => {
    it('should throw error for empty name', () => {
      expect(() =>
        Provider.create(
          validData.id,
          validData.ownerId,
          '',
          validData.type,
          validData.apiKey,
          validData.model
        )
      ).toThrow('Provider name is required');
    });

    it('should throw error for empty API key', () => {
      expect(() =>
        Provider.create(
          validData.id,
          validData.ownerId,
          validData.name,
          validData.type,
          '',
          validData.model
        )
      ).toThrow('API key is required');
    });

    it('should throw error for empty model', () => {
      expect(() =>
        Provider.create(
          validData.id,
          validData.ownerId,
          validData.name,
          validData.type,
          validData.apiKey,
          ''
        )
      ).toThrow('Model is required');
    });

    it('should trim whitespace from name', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        '  Test Provider  ',
        validData.type,
        validData.apiKey,
        validData.model
      );
      expect(provider.getName()).toBe('Test Provider');
    });
  });

  describe('updateName', () => {
    it('should update name and timestamp', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        validData.name,
        validData.type,
        validData.apiKey,
        validData.model
      );
      const oldTimestamp = provider.getUpdatedAt();

      // Small delay to ensure timestamp difference
      setTimeout(() => {
        provider.updateName('New Name');

        expect(provider.getName()).toBe('New Name');
        expect(provider.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
          oldTimestamp.getTime()
        );
      }, 10);
    });

    it('should throw error for empty name', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        validData.name,
        validData.type,
        validData.apiKey,
        validData.model
      );

      expect(() => provider.updateName('')).toThrow(
        'Provider name cannot be empty'
      );
    });
  });

  describe('updateApiKey', () => {
    it('should update API key and mark as invalid', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        validData.name,
        validData.type,
        validData.apiKey,
        validData.model
      );
      provider.markAsValid();

      provider.updateApiKey('new-api-key');

      expect(provider.getApiKey()).toBe('new-api-key');
      expect(provider.isValidProvider()).toBe(false);
      expect(provider.getLastTested()).toBeUndefined();
    });
  });

  describe('markAsValid / markAsInvalid', () => {
    it('should mark provider as valid', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        validData.name,
        validData.type,
        validData.apiKey,
        validData.model
      );

      provider.markAsValid();

      expect(provider.isValidProvider()).toBe(true);
      expect(provider.getLastTested()).toBeDefined();
    });

    it('should mark provider as invalid', () => {
      const provider = Provider.create(
        validData.id,
        validData.ownerId,
        validData.name,
        validData.type,
        validData.apiKey,
        validData.model
      );

      provider.markAsInvalid();

      expect(provider.isValidProvider()).toBe(false);
      expect(provider.getLastTested()).toBeDefined();
    });
  });
});
