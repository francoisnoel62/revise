// ABOUTME: Application use case for checking spelling and grammar using AI
// ABOUTME: Coordinates LLMProvider to analyze text and return corrections

import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { SpellCheckResult } from '@/domain/value-objects/SpellCheckCorrection';

export class CheckSpellingAndGrammarUseCase {
  constructor(private readonly llmProvider: LLMProvider) {}

  /**
   * Check spelling and grammar in the provided text.
   *
   * @param text The text to check
   * @param language Optional language hint (e.g., 'fr', 'en')
   * @returns SpellCheckResult with corrections and corrected text
   */
  async execute(text: string, language?: string): Promise<SpellCheckResult> {
    if (!text || text.trim().length === 0) {
      return {
        corrections: [],
        correctedText: text,
        hasErrors: false,
        summary: 'Aucun texte à vérifier.',
      };
    }

    return this.llmProvider.checkSpellingAndGrammar(text, language);
  }
}
