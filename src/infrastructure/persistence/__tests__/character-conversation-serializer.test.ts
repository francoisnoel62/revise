// ABOUTME: Tests for character-conversation-serializer
// ABOUTME: Verifies Document ↔ Entity conversion for CharacterConversation

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  serializeConversation,
  deserializeConversation,
  CharacterConversationDocument,
} from '../character-conversation-serializer';
import { CharacterConversation } from '@/domain/entities/CharacterConversation';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';

describe('character-conversation-serializer', () => {
  const validId = new ObjectId();

  const makeConversation = (id: string = validId.toHexString()) =>
    CharacterConversation.reconstruct({
      id,
      ownerId: 'owner-1',
      projectId: 'proj-1',
      characterId: 'char-1',
      messages: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });

  describe('serializeConversation', () => {
    it('produces an ObjectId _id', () => {
      const conv = makeConversation();
      const doc = serializeConversation(conv);
      expect(doc._id).toBeInstanceOf(ObjectId);
      expect(doc._id.toHexString()).toBe(validId.toHexString());
    });

    it('copies all scalar fields', () => {
      const conv = makeConversation();
      const doc = serializeConversation(conv);
      expect(doc.ownerId).toBe('owner-1');
      expect(doc.projectId).toBe('proj-1');
      expect(doc.characterId).toBe('char-1');
      expect(doc.createdAt).toEqual(new Date('2024-01-01'));
      expect(doc.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('serializes messages array', () => {
      const conv = makeConversation()
        .addMessage(ChatMessage.create('author', 'Hello'))
        .addMessage(ChatMessage.create('character', 'World'));
      const doc = serializeConversation(conv);
      expect(doc.messages).toHaveLength(2);
      expect(doc.messages[0].role).toBe('author');
      expect(doc.messages[0].content).toBe('Hello');
      expect(doc.messages[1].role).toBe('character');
    });
  });

  describe('deserializeConversation', () => {
    it('converts _id to hex string id', () => {
      const doc: CharacterConversationDocument = {
        _id: validId,
        ownerId: 'owner-1',
        projectId: 'proj-1',
        characterId: 'char-1',
        messages: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      const conv = deserializeConversation(doc);
      expect(conv.getId()).toBe(validId.toHexString());
      expect(conv.getOwnerId()).toBe('owner-1');
      expect(conv.getProjectId()).toBe('proj-1');
      expect(conv.getCharacterId()).toBe('char-1');
    });

    it('reconstructs messages as ChatMessage instances', () => {
      const fixedDate = new Date('2024-06-01T12:00:00Z');
      const doc: CharacterConversationDocument = {
        _id: validId,
        ownerId: 'owner-1',
        projectId: 'proj-1',
        characterId: 'char-1',
        messages: [{ role: 'author', content: 'Hi', createdAt: fixedDate }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const conv = deserializeConversation(doc);
      const messages = conv.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].getRole()).toBe('author');
      expect(messages[0].getContent()).toBe('Hi');
    });
  });

  describe('round-trip', () => {
    it('preserves all data through serialize → deserialize', () => {
      const original = makeConversation()
        .addMessage(ChatMessage.create('author', 'Question?'))
        .addMessage(ChatMessage.create('character', 'Answer.'));
      const doc = serializeConversation(original);
      const restored = deserializeConversation(doc);

      expect(restored.getId()).toBe(original.getId());
      expect(restored.getOwnerId()).toBe(original.getOwnerId());
      expect(restored.getProjectId()).toBe(original.getProjectId());
      expect(restored.getCharacterId()).toBe(original.getCharacterId());
      expect(restored.getMessages()).toHaveLength(2);
      expect(restored.getMessages()[0].getContent()).toBe('Question?');
      expect(restored.getMessages()[1].getContent()).toBe('Answer.');
    });
  });
});
