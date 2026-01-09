// ABOUTME: Domain entity representing an AI provider configuration.
// ABOUTME: Stores user-configured API credentials and provider settings.

/**
 * Supported AI provider types.
 */
export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'cohere'
  | 'google';

/**
 * Domain entity representing an AI provider configuration.
 * Stores user-configured API credentials and provider settings.
 *
 * IMPORTANT: This entity holds plain-text API keys in memory
 * but they are NEVER sent to the client. Client receives masked versions only.
 */
export class Provider {
  private readonly id: string;
  private readonly ownerId: string;
  private name: string;
  private type: ProviderType;
  private apiKey: string; // Plain-text in memory, encrypted in storage
  private model: string;
  private isValid: boolean;
  private lastTested?: Date;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    ownerId: string,
    name: string,
    type: ProviderType,
    apiKey: string,
    model: string,
    isValid: boolean = false,
    createdAt: Date,
    updatedAt: Date,
    lastTested?: Date
  ) {
    // Validation
    if (!id) throw new Error('Provider ID is required');
    if (!ownerId) throw new Error('Provider ownerId is required');
    if (!name || name.trim().length === 0) {
      throw new Error('Provider name is required');
    }
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }
    if (!model || model.trim().length === 0) {
      throw new Error('Model is required');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.name = name.trim();
    this.type = type;
    this.apiKey = apiKey.trim();
    this.model = model.trim();
    this.isValid = isValid;
    this.lastTested = lastTested;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Factory method to create a new provider.
   *
   * @param id Unique identifier for the provider
   * @param ownerId User ID who owns this provider
   * @param name User-friendly name (e.g., "OpenAI Production")
   * @param type Provider type (openai, anthropic, etc.)
   * @param apiKey API key (will be encrypted in storage)
   * @param model Model name (e.g., 'gpt-4o-mini')
   * @returns New Provider instance
   */
  static create(
    id: string,
    ownerId: string,
    name: string,
    type: ProviderType,
    apiKey: string,
    model: string
  ): Provider {
    const now = new Date();
    return new Provider(
      id,
      ownerId,
      name,
      type,
      apiKey,
      model,
      false, // Not validated yet
      now,
      now
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getName(): string {
    return this.name;
  }

  getType(): ProviderType {
    return this.type;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getModel(): string {
    return this.model;
  }

  isValidProvider(): boolean {
    return this.isValid;
  }

  getLastTested(): Date | undefined {
    return this.lastTested;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Mutations
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Provider name cannot be empty');
    }
    this.name = newName.trim();
    this.touch();
  }

  updateApiKey(newApiKey: string): void {
    if (!newApiKey || newApiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }
    this.apiKey = newApiKey.trim();
    this.isValid = false; // Needs re-validation
    this.lastTested = undefined;
    this.touch();
  }

  updateModel(newModel: string): void {
    if (!newModel || newModel.trim().length === 0) {
      throw new Error('Model cannot be empty');
    }
    this.model = newModel.trim();
    this.touch();
  }

  markAsValid(): void {
    this.isValid = true;
    this.lastTested = new Date();
    this.touch();
  }

  markAsInvalid(): void {
    this.isValid = false;
    this.lastTested = new Date();
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
