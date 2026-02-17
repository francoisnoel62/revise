// ABOUTME: Value object capturing the exact prompts sent to the AI provider
// ABOUTME: Stores system prompt, user message, and human-readable summary for transparency

export interface PromptSnapshot {
  readonly systemPrompt: string;
  readonly userMessage: string;
  readonly humanReadableSummary: string;  // e.g., "Génération complète du chapitre"
}
