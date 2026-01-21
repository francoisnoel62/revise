// ABOUTME: Unit tests for Character domain entity
// ABOUTME: Validates creation, getters, mutations, and validation constraints

import { describe, it, expect } from 'vitest';
import { Character, CharacterProperties } from './Character';

describe('Character', () => {
  const validProps: CharacterProperties = {
    id: 'char-1',
    projectId: 'project-1',
    ownerId: 'user-1',
    name: 'Jean Valjean',
    identity: 'Former convict turned mayor',
    appearance: 'Tall, strong, weathered face',
    psychology: 'Conflicted between past and redemption',
    voiceAndLanguage: 'Formal, reflective',
    backstory: 'Spent 19 years in prison for stealing bread',
    relationships: 'Father figure to Cosette',
    narrativeFunction: 'Protagonist seeking redemption',
    openQuestions: 'Will he find peace?',
    createdAt: new Date('2026-01-20T10:00:00Z'),
    updatedAt: new Date('2026-01-20T10:00:00Z'),
  };

  describe('create', () => {
    it('should create a valid Character with all fields', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      expect(character.getId()).toBe(validProps.id);
      expect(character.getProjectId()).toBe(validProps.projectId);
      expect(character.getOwnerId()).toBe(validProps.ownerId);
      expect(character.getName()).toBe(validProps.name);
      expect(character.getIdentity()).toBe('');
      expect(character.getAppearance()).toBe('');
      expect(character.getPsychology()).toBe('');
      expect(character.getVoiceAndLanguage()).toBe('');
      expect(character.getBackstory()).toBe('');
      expect(character.getRelationships()).toBe('');
      expect(character.getNarrativeFunction()).toBe('');
      expect(character.getOpenQuestions()).toBe('');
    });

    it('should set createdAt and updatedAt to current time', () => {
      const before = new Date();
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );
      const after = new Date();

      expect(character.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(character.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
      expect(character.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(character.getUpdatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a Character from persisted data', () => {
      const character = Character.reconstruct(validProps);

      expect(character.getId()).toBe(validProps.id);
      expect(character.getProjectId()).toBe(validProps.projectId);
      expect(character.getOwnerId()).toBe(validProps.ownerId);
      expect(character.getName()).toBe(validProps.name);
      expect(character.getIdentity()).toBe(validProps.identity);
      expect(character.getAppearance()).toBe(validProps.appearance);
      expect(character.getPsychology()).toBe(validProps.psychology);
      expect(character.getVoiceAndLanguage()).toBe(validProps.voiceAndLanguage);
      expect(character.getBackstory()).toBe(validProps.backstory);
      expect(character.getRelationships()).toBe(validProps.relationships);
      expect(character.getNarrativeFunction()).toBe(validProps.narrativeFunction);
      expect(character.getOpenQuestions()).toBe(validProps.openQuestions);
      expect(character.getCreatedAt()).toEqual(validProps.createdAt);
      expect(character.getUpdatedAt()).toEqual(validProps.updatedAt);
    });
  });

  describe('validation', () => {
    it('should throw error if id is empty', () => {
      expect(() => Character.create('', validProps.projectId, validProps.ownerId, validProps.name))
        .toThrow('Character ID cannot be empty');
    });

    it('should throw error if id is whitespace only', () => {
      expect(() => Character.create('   ', validProps.projectId, validProps.ownerId, validProps.name))
        .toThrow('Character ID cannot be empty');
    });

    it('should throw error if projectId is empty', () => {
      expect(() => Character.create(validProps.id, '', validProps.ownerId, validProps.name))
        .toThrow('Project ID cannot be empty');
    });

    it('should throw error if ownerId is empty', () => {
      expect(() => Character.create(validProps.id, validProps.projectId, '', validProps.name))
        .toThrow('Owner ID cannot be empty');
    });

    it('should throw error if name is empty', () => {
      expect(() => Character.create(validProps.id, validProps.projectId, validProps.ownerId, ''))
        .toThrow('Character name cannot be empty');
    });

    it('should throw error if name is whitespace only', () => {
      expect(() => Character.create(validProps.id, validProps.projectId, validProps.ownerId, '   '))
        .toThrow('Character name cannot be empty');
    });
  });

  describe('mutations', () => {
    it('should update name and return new instance', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      const updated = character.updateName('Javert');

      expect(updated.getName()).toBe('Javert');
      expect(character.getName()).toBe(validProps.name); // Original unchanged
      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(character.getUpdatedAt().getTime());
    });

    it('should throw error when updating name to empty', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      expect(() => character.updateName('')).toThrow('Character name cannot be empty');
    });

    it('should update identity and return new instance', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      const updated = character.updateIdentity('Inspector of police');

      expect(updated.getIdentity()).toBe('Inspector of police');
      expect(character.getIdentity()).toBe(''); // Original unchanged
    });

    it('should update all profile fields', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      const updated = character
        .updateIdentity('Former convict')
        .updateAppearance('Tall and strong')
        .updatePsychology('Complex moral character')
        .updateVoiceAndLanguage('Formal speech')
        .updateBackstory('19 years in prison')
        .updateRelationships('Father to Cosette')
        .updateNarrativeFunction('Protagonist')
        .updateOpenQuestions('Will he escape?');

      expect(updated.getIdentity()).toBe('Former convict');
      expect(updated.getAppearance()).toBe('Tall and strong');
      expect(updated.getPsychology()).toBe('Complex moral character');
      expect(updated.getVoiceAndLanguage()).toBe('Formal speech');
      expect(updated.getBackstory()).toBe('19 years in prison');
      expect(updated.getRelationships()).toBe('Father to Cosette');
      expect(updated.getNarrativeFunction()).toBe('Protagonist');
      expect(updated.getOpenQuestions()).toBe('Will he escape?');
    });

    it('should allow empty string for optional fields', () => {
      const character = Character.reconstruct(validProps);

      const updated = character.updateIdentity('');

      expect(updated.getIdentity()).toBe('');
    });
  });

  describe('trimming behavior', () => {
    it('should trim name on create', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        '  Jean Valjean  '
      );

      expect(character.getName()).toBe('Jean Valjean');
    });

    it('should trim name on update', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      const updated = character.updateName('  Javert  ');

      expect(updated.getName()).toBe('Javert');
    });

    it('should trim optional fields', () => {
      const character = Character.create(
        validProps.id,
        validProps.projectId,
        validProps.ownerId,
        validProps.name
      );

      const updated = character.updateIdentity('  Former convict  ');

      expect(updated.getIdentity()).toBe('Former convict');
    });
  });

  describe('immutability', () => {
    it('should return a copy of createdAt date', () => {
      const character = Character.reconstruct(validProps);
      const date = character.getCreatedAt();
      date.setFullYear(2000);

      expect(character.getCreatedAt().getFullYear()).toBe(2026);
    });

    it('should return a copy of updatedAt date', () => {
      const character = Character.reconstruct(validProps);
      const date = character.getUpdatedAt();
      date.setFullYear(2000);

      expect(character.getUpdatedAt().getFullYear()).toBe(2026);
    });
  });

  describe('toProperties', () => {
    it('should convert entity to plain object', () => {
      const character = Character.reconstruct(validProps);
      const props = character.toProperties();

      expect(props).toEqual(validProps);
    });
  });
});
