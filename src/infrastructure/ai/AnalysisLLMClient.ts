// ABOUTME: LLM client for chapter analysis operations
// ABOUTME: Wraps provider-specific implementations with analysis-specific prompts

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
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

  /**
   * Extract JSON from response, handling markdown code blocks.
   */
  private extractJson(content: string): string {
    let text = content.trim();

    // Try to extract from complete markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    } else {
      // Handle unclosed code block (response might be truncated)
      const openBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*)/);
      if (openBlockMatch) {
        text = openBlockMatch[1].trim();
      }
    }

    // If no code block, try to find JSON object directly
    if (!text.startsWith('{')) {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        text = text.slice(jsonStart, jsonEnd + 1);
      }
    }

    return text;
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
      max_tokens: 8192, // Ensure enough tokens for detailed analysis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    try {
      const jsonText = this.extractJson(content);
      return JSON.parse(jsonText) as T;
    } catch {
      throw new Error(`Failed to parse LLM response: ${content}`);
    }
  }
}

/**
 * Anthropic Claude implementation of the AnalysisLLMClient.
 */
export class AnthropicAnalysisLLMClient implements AnalysisLLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-5-20250929') {
    this.client = new Anthropic({ apiKey });
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

  /**
   * Extract JSON from Claude's response, handling markdown code blocks.
   */
  private extractJson(content: string): string {
    let text = content.trim();

    // Try to extract from complete markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    } else {
      // Handle unclosed code block (response might be truncated)
      const openBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*)/);
      if (openBlockMatch) {
        text = openBlockMatch[1].trim();
      }
    }

    // If no code block, try to find JSON object directly
    if (!text.startsWith('{')) {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        text = text.slice(jsonStart, jsonEnd + 1);
      }
    }

    return text;
  }

  private async callLLM<T>(prompt: string): Promise<T> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192, // Ensure enough tokens for detailed analysis
      temperature: 0.3, // Lower temperature for consistent analysis
      system:
        'You are a professional text analysis assistant. Always respond with valid JSON only, no markdown formatting or explanatory text.',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    try {
      const jsonText = this.extractJson(content.text);
      return JSON.parse(jsonText) as T;
    } catch {
      throw new Error(`Failed to parse LLM response: ${content.text}`);
    }
  }
}

/**
 * Google Gemini implementation of the AnalysisLLMClient.
 */
export class GoogleAnalysisLLMClient implements AnalysisLLMClient {
  private client: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, model: string = 'gemini-3-flash-preview') {
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = model;
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

  /**
   * Extract JSON from Gemini's response, handling markdown code blocks.
   */
  private extractJson(content: string): string {
    let text = content.trim();

    // Try to extract from complete markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    } else {
      // Handle unclosed code block (response might be truncated)
      const openBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*)/);
      if (openBlockMatch) {
        text = openBlockMatch[1].trim();
      }
    }

    // If no code block, try to find JSON object directly
    if (!text.startsWith('{')) {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        text = text.slice(jsonStart, jsonEnd + 1);
      }
    }

    return text;
  }

  private async callLLM<T>(prompt: string): Promise<T> {
    const systemPrompt =
      'You are a professional text analysis assistant. Always respond with valid JSON only, no markdown formatting or explanatory text.';

    const result = await this.client.models.generateContent({
      model: this.modelName,
      contents: `${systemPrompt}\n\n---\n\n${prompt}`,
      config: {
        temperature: 0.3, // Lower temperature for consistent analysis
        maxOutputTokens: 8192, // Ensure enough tokens for detailed analysis
      },
    });

    const content = result.text;
    if (!content) {
      throw new Error('Empty response from Google AI');
    }

    try {
      const jsonText = this.extractJson(content);
      return JSON.parse(jsonText) as T;
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
    case 'anthropic':
      return new AnthropicAnalysisLLMClient(apiKey, model);
    case 'google':
      return new GoogleAnalysisLLMClient(apiKey, model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
