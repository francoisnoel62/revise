// ABOUTME: Domain interface for model pricing persistence and retrieval.
// ABOUTME: Stores USD/M token rates fetched from OpenRouter, used to compute EUR costs at call time.

export type PricingProvider = 'anthropic' | 'openai' | 'google';

export interface ModelPricingEntry {
  id: string;
  provider: PricingProvider;
  /** Model id prefix for startsWith matching, e.g. "claude-opus-4" */
  prefix: string;
  /** USD per million input tokens */
  inputPerM: number;
  /** USD per million output tokens */
  outputPerM: number;
  /** USD per million cached input tokens */
  cachedInputPerM: number;
  /**
   * Whether cached tokens are already counted inside inputTokens.
   * false for Anthropic (reported separately), true for OpenAI/Google.
   */
  cachedInInput: boolean;
  updatedAt: Date;
}

export interface ModelPricingRepository {
  upsertMany(entries: Omit<ModelPricingEntry, 'id'>[]): Promise<void>;
  findByProvider(provider: PricingProvider): Promise<ModelPricingEntry[]>;
  findAll(): Promise<ModelPricingEntry[]>;
  update(id: string, data: Partial<Omit<ModelPricingEntry, 'id' | 'provider' | 'prefix'>>): Promise<ModelPricingEntry | null>;
  delete(id: string): Promise<void>;
}
