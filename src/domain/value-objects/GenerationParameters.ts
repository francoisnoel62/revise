// ABOUTME: Value object representing AI generation parameters used for a request
// ABOUTME: Captures model configuration: temperature, max tokens, and thinking budget

export interface GenerationParameters {
  readonly temperature: number | null;   // null when extended thinking is enabled
  readonly maxTokens: number;
  readonly thinkingBudget: number;       // token budget for extended thinking
  readonly thinkingEnabled: boolean;
}
