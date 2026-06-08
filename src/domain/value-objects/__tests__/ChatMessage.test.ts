// ABOUTME: Tests for ChatMessage value object
// ABOUTME: Covers creation, validation, reconstruction, and serialization

import { describe, it, expect } from 'vitest';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage', () => {
  describe('create', () => {
    it('creates a message with role author and correct getters', () => {
      const msg = ChatMessage.create('author', 'Hello character');
      expect(msg.getRole()).toBe('author');
      expect(msg.getContent()).toBe('Hello character');
      expect(msg.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('creates a message with role character and correct getters', () => {
      const msg = ChatMessage.create('character', 'Bonjour, auteur');
      expect(msg.getRole()).toBe('character');
      expect(msg.getContent()).toBe('Bonjour, auteur');
    });

    it('throws when content is empty', () => {
      expect(() => ChatMessage.create('author', '')).toThrow('ChatMessage content cannot be empty');
    });

    it('throws when content is whitespace only', () => {
      expect(() => ChatMessage.create('author', '   ')).toThrow('ChatMessage content cannot be empty');
    });

    it('trims content on create', () => {
      const msg = ChatMessage.create('author', '  trimmed  ');
      expect(msg.getContent()).toBe('trimmed');
    });
  });

  describe('reconstruct', () => {
    it('preserves all fields including createdAt', () => {
      const fixedDate = new Date('2024-01-15T10:00:00Z');
      const msg = ChatMessage.reconstruct({ role: 'character', content: 'Historic', createdAt: fixedDate });
      expect(msg.getRole()).toBe('character');
      expect(msg.getContent()).toBe('Historic');
      expect(msg.getCreatedAt()).toEqual(fixedDate);
    });
  });

  describe('toProperties', () => {
    it('returns a plain object with all fields', () => {
      const msg = ChatMessage.create('author', 'test');
      const props = msg.toProperties();
      expect(props).toHaveProperty('role', 'author');
      expect(props).toHaveProperty('content', 'test');
      expect(props).toHaveProperty('createdAt');
      expect(props.createdAt).toBeInstanceOf(Date);
    });
  });
});
