// ABOUTME: Serializes CharacterConversation domain entities to/from MongoDB documents.
// ABOUTME: Maps domain id string to BSON ObjectId (_id).

import { ObjectId } from 'mongodb';
import { CharacterConversation, CharacterConversationProperties } from '../../domain/entities/CharacterConversation';

export interface CharacterConversationDocument {
  _id: ObjectId;
  ownerId: string;
  projectId: string;
  characterId: string;
  messages: CharacterConversationProperties['messages'];
  createdAt: Date;
  updatedAt: Date;
}

export function serializeConversation(
  conversation: CharacterConversation,
): CharacterConversationDocument {
  return {
    _id: new ObjectId(conversation.getId()),
    ownerId: conversation.getOwnerId(),
    projectId: conversation.getProjectId(),
    characterId: conversation.getCharacterId(),
    messages: conversation.toProperties().messages,
    createdAt: conversation.getCreatedAt(),
    updatedAt: conversation.getUpdatedAt(),
  };
}

export function deserializeConversation(
  doc: CharacterConversationDocument,
): CharacterConversation {
  return CharacterConversation.reconstruct({
    id: doc._id.toHexString(),
    ownerId: doc.ownerId,
    projectId: doc.projectId,
    characterId: doc.characterId,
    messages: doc.messages,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}
