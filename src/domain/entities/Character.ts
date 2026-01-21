// ABOUTME: Domain entity representing a character in a writing project
// ABOUTME: Maps to the Characters value object structure from AI generation

export interface CharacterProperties {
  id: string;
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

export class Character {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private name: string;
  private identity: string;
  private appearance: string;
  private psychology: string;
  private voiceAndLanguage: string;
  private backstory: string;
  private relationships: string;
  private narrativeFunction: string;
  private openQuestions: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: CharacterProperties) {
    this.validate(props);

    this.id = props.id.trim();
    this.projectId = props.projectId.trim();
    this.ownerId = props.ownerId.trim();
    this.name = props.name.trim();
    this.identity = props.identity.trim();
    this.appearance = props.appearance.trim();
    this.psychology = props.psychology.trim();
    this.voiceAndLanguage = props.voiceAndLanguage.trim();
    this.backstory = props.backstory.trim();
    this.relationships = props.relationships.trim();
    this.narrativeFunction = props.narrativeFunction.trim();
    this.openQuestions = props.openQuestions.trim();
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validate(props: CharacterProperties): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Character ID cannot be empty');
    }
    if (!props.projectId || props.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }
    if (!props.ownerId || props.ownerId.trim().length === 0) {
      throw new Error('Owner ID cannot be empty');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Character name cannot be empty');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    name: string
  ): Character {
    const now = new Date();
    return new Character({
      id,
      projectId,
      ownerId,
      name,
      identity: '',
      appearance: '',
      psychology: '',
      voiceAndLanguage: '',
      backstory: '',
      relationships: '',
      narrativeFunction: '',
      openQuestions: '',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: CharacterProperties): Character {
    return new Character(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getName(): string {
    return this.name;
  }

  getIdentity(): string {
    return this.identity;
  }

  getAppearance(): string {
    return this.appearance;
  }

  getPsychology(): string {
    return this.psychology;
  }

  getVoiceAndLanguage(): string {
    return this.voiceAndLanguage;
  }

  getBackstory(): string {
    return this.backstory;
  }

  getRelationships(): string {
    return this.relationships;
  }

  getNarrativeFunction(): string {
    return this.narrativeFunction;
  }

  getOpenQuestions(): string {
    return this.openQuestions;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt.getTime());
  }

  // Mutations (return new instance for immutability)
  updateName(name: string): Character {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Character name cannot be empty');
    }
    return new Character({
      ...this.toProperties(),
      name: trimmedName,
      updatedAt: new Date(),
    });
  }

  updateIdentity(identity: string): Character {
    return new Character({
      ...this.toProperties(),
      identity: identity.trim(),
      updatedAt: new Date(),
    });
  }

  updateAppearance(appearance: string): Character {
    return new Character({
      ...this.toProperties(),
      appearance: appearance.trim(),
      updatedAt: new Date(),
    });
  }

  updatePsychology(psychology: string): Character {
    return new Character({
      ...this.toProperties(),
      psychology: psychology.trim(),
      updatedAt: new Date(),
    });
  }

  updateVoiceAndLanguage(voiceAndLanguage: string): Character {
    return new Character({
      ...this.toProperties(),
      voiceAndLanguage: voiceAndLanguage.trim(),
      updatedAt: new Date(),
    });
  }

  updateBackstory(backstory: string): Character {
    return new Character({
      ...this.toProperties(),
      backstory: backstory.trim(),
      updatedAt: new Date(),
    });
  }

  updateRelationships(relationships: string): Character {
    return new Character({
      ...this.toProperties(),
      relationships: relationships.trim(),
      updatedAt: new Date(),
    });
  }

  updateNarrativeFunction(narrativeFunction: string): Character {
    return new Character({
      ...this.toProperties(),
      narrativeFunction: narrativeFunction.trim(),
      updatedAt: new Date(),
    });
  }

  updateOpenQuestions(openQuestions: string): Character {
    return new Character({
      ...this.toProperties(),
      openQuestions: openQuestions.trim(),
      updatedAt: new Date(),
    });
  }

  toProperties(): CharacterProperties {
    return {
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      name: this.name,
      identity: this.identity,
      appearance: this.appearance,
      psychology: this.psychology,
      voiceAndLanguage: this.voiceAndLanguage,
      backstory: this.backstory,
      relationships: this.relationships,
      narrativeFunction: this.narrativeFunction,
      openQuestions: this.openQuestions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
