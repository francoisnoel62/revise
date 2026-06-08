// ABOUTME: Tests for CharacterConversation entity
// ABOUTME: Covers creation, validation, immutability, and message management

import { describe, it, expect } from 'vitest';
import { CharacterConversation } from '../CharacterConversation';
import { ChatMessage } from '../../value-objects/ChatMessage';

describe('CharacterConversation', () => {
  describe('create', () => {
    it('creates a conversation with valid parameters and zero messages', () => {
      const conv = CharacterConversation.create('conv-1', 'owner-1', 'proj-1', 'char-1');
      expect(conv.getId()).toBe('conv-1');
      expect(conv.getOwnerId()).toBe('owner-1');
      expect(conv.getProjectId()).toBe('proj-1');
      expect(conv.getCharacterId()).toBe('char-1');
      expect(conv.getMessages()).toHaveLength(0);
      expect(conv.getCreatedAt()).toBeInstanceOf(Date);
      expect(conv.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('throws when id is empty', () => {
      expect(() => CharacterConversation.create('', 'owner-1', 'proj-1', 'char-1')).toThrow('id is required');
    });

    it('throws when ownerId is empty', () => {
      expect(() => CharacterConversation.create('conv-1', '', 'proj-1', 'char-1')).toThrow('ownerId is required');
    });

    it('throws when projectId is empty', () => {
      expect(() => CharacterConversation.create('conv-1', 'owner-1', '', 'char-1')).toThrow('projectId is required');
    });

    it('throws when characterId is empty', () => {
      expect(() => CharacterConversation.create('conv-1', 'owner-1', 'proj-1', '')).toThrow('characterId is required');
    });
  });

  describe('addMessage', () => {
    it('returns a new instance (immutability)', () => {
      const conv = CharacterConversation.create('conv-1', 'owner-1', 'proj-1', 'char-1');
      const msg = ChatMessage.create('author', 'Hello');
      const updated = conv.addMessage(msg);
      expect(updated).not.toBe(conv);
      expect(conv.getMessages()).toHaveLength(0);
      expect(updated.getMessages()).toHaveLength(1);
    });

    it('updates updatedAt when a message is added', async () => {
      const conv = CharacterConversation.create('conv-1', 'owner-1', 'proj-1', 'char-1');
      const before = conv.getUpdatedAt();
      await new Promise(r => setTimeout(r, 5));
      const msg = ChatMessage.create('author', 'Hello');
      const updated = conv.addMessage(msg);
      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('getMessages returns ChatMessage instances', () => {
      const conv = CharacterConversation.create('conv-1', 'owner-1', 'proj-1', 'char-1');
      const msg = ChatMessage.create('character', 'I am alive');
      const updated = conv.addMessage(msg);
      const messages = updated.getMessages();
      expect(messages[0]).toBeInstanceOf(ChatMessage);
      expect(messages[0].getContent()).toBe('I am alive');
    });
  });

  describe('reconstruct', () => {
    it('preserves all fields', () => {
      const now = new Date('2024-03-01T12:00:00Z');
      const conv = CharacterConversation.reconstruct({
        id: 'conv-42',
        ownerId: 'user-7',
        projectId: 'proj-3',
        characterId: 'char-9',
        messages: [],
        createdAt: now,
        updatedAt: now,
      });
      expect(conv.getId()).toBe('conv-42');
      expect(conv.getOwnerId()).toBe('user-7');
      expect(conv.getProjectId()).toBe('proj-3');
      expect(conv.getCharacterId()).toBe('char-9');
      expect(conv.getCreatedAt()).toEqual(now);
      expect(conv.getUpdatedAt()).toEqual(now);
    });
  });
});
