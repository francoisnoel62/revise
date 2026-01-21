// ABOUTME: Serialization utilities for Character entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety for character profiles

import { Character, CharacterProperties } from '@/domain/entities/Character';
import { ObjectId } from 'mongodb';

export interface CharacterDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  name: string;
  identity: string;
  appearance: string;
  psychology: string;
  voiceAndLanguage: string;
  backstory: string;
  relationships: string;
  narrativeFunction: string;
  openQuestions: string;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeCharacter(character: Character): Omit<CharacterDocument, '_id'> & { _id: ObjectId } {
  return {
    _id: new ObjectId(character.getId()),
    projectId: character.getProjectId(),
    ownerId: character.getOwnerId(),
    name: character.getName(),
    identity: character.getIdentity(),
    appearance: character.getAppearance(),
    psychology: character.getPsychology(),
    voiceAndLanguage: character.getVoiceAndLanguage(),
    backstory: character.getBackstory(),
    relationships: character.getRelationships(),
    narrativeFunction: character.getNarrativeFunction(),
    openQuestions: character.getOpenQuestions(),
    createdAt: character.getCreatedAt(),
    updatedAt: character.getUpdatedAt(),
  };
}

export function deserializeCharacter(doc: CharacterDocument): Character {
  const props: CharacterProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    name: doc.name,
    identity: doc.identity,
    appearance: doc.appearance,
    psychology: doc.psychology,
    voiceAndLanguage: doc.voiceAndLanguage,
    backstory: doc.backstory,
    relationships: doc.relationships,
    narrativeFunction: doc.narrativeFunction,
    openQuestions: doc.openQuestions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return Character.reconstruct(props);
}
