// ABOUTME: Domain entity representing a persisted conversation between the author and a character persona.
// ABOUTME: Owned by ownerId; scoped to a project and a specific character.

import { ChatMessage, ChatMessageProperties } from '../value-objects/ChatMessage';

export interface CharacterConversationProperties {
  id: string;
  ownerId: string;
  projectId: string;
  characterId: string;
  messages: ChatMessageProperties[];
  createdAt: Date;
  updatedAt: Date;
}

export class CharacterConversation {
  private constructor(private readonly props: CharacterConversationProperties) {}

  static create(
    id: string,
    ownerId: string,
    projectId: string,
    characterId: string,
  ): CharacterConversation {
    if (!id.trim()) throw new Error('id is required');
    if (!ownerId.trim()) throw new Error('ownerId is required');
    if (!projectId.trim()) throw new Error('projectId is required');
    if (!characterId.trim()) throw new Error('characterId is required');
    const now = new Date();
    return new CharacterConversation({ id, ownerId, projectId, characterId, messages: [], createdAt: now, updatedAt: now });
  }

  static reconstruct(props: CharacterConversationProperties): CharacterConversation {
    return new CharacterConversation(props);
  }

  getId(): string { return this.props.id; }
  getOwnerId(): string { return this.props.ownerId; }
  getProjectId(): string { return this.props.projectId; }
  getCharacterId(): string { return this.props.characterId; }
  getCreatedAt(): Date { return this.props.createdAt; }
  getUpdatedAt(): Date { return this.props.updatedAt; }

  getMessages(): ChatMessage[] {
    return this.props.messages.map(ChatMessage.reconstruct);
  }

  addMessage(message: ChatMessage): CharacterConversation {
    return new CharacterConversation({
      ...this.props,
      messages: [...this.props.messages, message.toProperties()],
      updatedAt: new Date(),
    });
  }

  toProperties(): CharacterConversationProperties {
    return { ...this.props, messages: [...this.props.messages] };
  }
}
