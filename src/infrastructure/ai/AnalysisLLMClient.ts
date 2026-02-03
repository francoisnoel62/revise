// ABOUTME: LLM client for chapter analysis operations
// ABOUTME: Wraps provider-specific implementations with analysis-specific prompts

import OpenAI from 'openai';
import {
  SpellingLLMClient,
  SpellingAnalysisResponse,
  SPELLING_ANALYSIS_PROMPT,
} from '@/application/strategies/SpellingAnalysisStrategy';
import {
  GrammarLLMClient,
  GrammarAnalysisResponse,
  GRAMMAR_ANALYSIS_PROMPT,
} from '@/application/strategies/GrammarAnalysisStrategy';
import {
  PunctuationLLMClient,
  PunctuationAnalysisResponse,
  PUNCTUATION_ANALYSIS_PROMPT,
} from '@/application/strategies/PunctuationAnalysisStrategy';
import {
  StyleLLMClient,
  StyleAnalysisResponse,
  STYLE_ANALYSIS_PROMPT,
} from '@/application/strategies/StyleAnalysisStrategy';
import {
  RepetitionLLMClient,
  RepetitionAnalysisResponse,
  REPETITION_ANALYSIS_PROMPT,
} from '@/application/strategies/RepetitionAnalysisStrategy';
import { StyleRigor } from '@/domain/value-objects/StyleRigor';

/**
 * Combined interface for all analysis LLM operations.
 */
export interface AnalysisLLMClient
  extends SpellingLLMClient,
    GrammarLLMClient,
    PunctuationLLMClient,
    StyleLLMClient,
    RepetitionLLMClient {}

/**
 * OpenAI implementation of the AnalysisLLMClient.
 */
export class OpenAIAnalysisLLMClient implements AnalysisLLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyzeSpelling(
    content: string,
    options: { language: 'fr' | 'en' }
  ): Promise<SpellingAnalysisResponse> {
    const prompt = SPELLING_ANALYSIS_PROMPT
      .replace('{language}', options.language === 'fr' ? 'French' : 'English')
      .replace('{content}', content);

    return this.callLLM<SpellingAnalysisResponse>(prompt);
  }

  async analyzeGrammar(
    content: string,
    options: { language: 'fr' | 'en' }
  ): Promise<GrammarAnalysisResponse> {
    const prompt = GRAMMAR_ANALYSIS_PROMPT
      .replace('{language}', options.language === 'fr' ? 'French' : 'English')
      .replace('{content}', content);

    return this.callLLM<GrammarAnalysisResponse>(prompt);
  }

  async analyzePunctuation(
    content: string,
    options: { language: 'fr' | 'en' }
  ): Promise<PunctuationAnalysisResponse> {
    const prompt = PUNCTUATION_ANALYSIS_PROMPT
      .replace('{language}', options.language === 'fr' ? 'French' : 'English')
      .replace('{content}', content);

    return this.callLLM<PunctuationAnalysisResponse>(prompt);
  }

  async analyzeStyle(
    content: string,
    options: { language: 'fr' | 'en'; rigor: StyleRigor; activeRules: string[] }
  ): Promise<StyleAnalysisResponse> {
    const prompt = STYLE_ANALYSIS_PROMPT
      .replace('{language}', options.language === 'fr' ? 'French' : 'English')
      .replace('{rigor}', options.rigor)
      .replace('{activeRules}', options.activeRules.join(', '))
      .replace('{content}', content);

    return this.callLLM<StyleAnalysisResponse>(prompt);
  }

  async analyzeRepetitions(
    content: string,
    options: { language: 'fr' | 'en'; exclusions: string[] }
  ): Promise<RepetitionAnalysisResponse> {
    const prompt = REPETITION_ANALYSIS_PROMPT
      .replace('{language}', options.language === 'fr' ? 'French' : 'English')
      .replace('{exclusions}', options.exclusions.join(', ') || 'none')
      .replace('{content}', content);

    return this.callLLM<RepetitionAnalysisResponse>(prompt);
  }

  private async callLLM<T>(prompt: string): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional text analysis assistant. Always respond with valid JSON only, no markdown formatting.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new Error(`Failed to parse LLM response: ${content}`);
    }
  }
}

/**
 * Factory function to create an AnalysisLLMClient based on provider.
 */
export function createAnalysisLLMClient(
  provider: 'openai' | 'anthropic' | 'google',
  apiKey: string,
  model?: string
): AnalysisLLMClient {
  switch (provider) {
    case 'openai':
      return new OpenAIAnalysisLLMClient(apiKey, model);
    // TODO: Add Anthropic and Google implementations
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
