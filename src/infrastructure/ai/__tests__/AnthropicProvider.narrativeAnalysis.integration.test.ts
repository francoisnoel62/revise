// ABOUTME: Integration tests for AnthropicProvider narrative analysis
// ABOUTME: Tests real API calls with Anthropic Claude (skipped by default)

import { describe, it, expect } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import { FilePromptRepository } from '@/infrastructure/prompts/FilePromptRepository';

describe('AnthropicProvider.generateNarrativeAnalysis (Integration)', () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Skip by default - enable manually when needed
  // Requires valid ANTHROPIC_API_KEY environment variable
  it.skip('should generate real narrative analysis with French text', async () => {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY required for integration test');
    }

    const promptRepo = new FilePromptRepository();
    const provider = new AnthropicProvider(apiKey, promptRepo, 'claude-sonnet-4-5-20250929');

    const sampleText = `
# Chapitre 1

Je me souviens de ce matin-là. Le soleil perçait à travers les rideaux
de ma chambre d'hôtel, projetant des rectangles de lumière sur le parquet usé.
J'avais mal dormi, comme d'habitude.

Marie était partie avant l'aube, sans un mot. Son parfum flottait encore
dans la pièce, mélangé à l'odeur âcre du café froid sur la table de nuit.

Je me suis levé. J'ai regardé par la fenêtre. Paris s'éveillait lentement,
indifférent à ma solitude.

# Chapitre 2

L'après-midi était déjà bien avancé quand je retrouvai Thomas au café.
Il m'attendait, les yeux perdus dans la rue animée. Nous nous connaissions
depuis l'université, mais notre amitié s'était effilochée avec les années.

"Tu as l'air fatigué", dit-il simplement.
    `.trim();

    const result = await provider.generateNarrativeAnalysis(sampleText);

    // Validate structure
    expect(result.narratorType).toBeTruthy();
    expect(typeof result.narratorType).toBe('string');
    expect(result.narratorType.length).toBeGreaterThan(10);

    expect(result.focalization).toBeTruthy();
    expect(typeof result.focalization).toBe('string');
    expect(result.focalization.length).toBeGreaterThan(10);

    expect(result.temporality).toBeTruthy();
    expect(typeof result.temporality).toBe('string');
    expect(result.temporality.length).toBeGreaterThan(10);

    expect(result.chapterStructure).toBeTruthy();
    expect(typeof result.chapterStructure).toBe('string');
    expect(result.chapterStructure.length).toBeGreaterThan(10);

    expect(result.narrativeVoice).toBeInstanceOf(Array);
    expect(result.narrativeVoice.length).toBe(5);
    result.narrativeVoice.forEach((point) => {
      expect(typeof point).toBe('string');
      expect(point.length).toBeGreaterThan(5);
    });

    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(10);

    // Should detect first person narrator
    expect(result.narratorType.toLowerCase()).toMatch(/première|first|je|interne/i);
  }, 30000); // 30s timeout for API call

  it.skip('should generate real narrative analysis with English text', async () => {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY required for integration test');
    }

    const promptRepo = new FilePromptRepository();
    const provider = new AnthropicProvider(apiKey, promptRepo, 'claude-sonnet-4-5-20250929');

    const sampleText = `
# Chapter 1

I remember that morning. The sun pierced through the curtains of my hotel room,
casting rectangles of light on the worn wooden floor. I had slept poorly, as usual.

Marie had left before dawn, without a word. Her perfume still lingered in the room,
mixed with the acrid smell of cold coffee on the nightstand.

I got up. I looked out the window. Paris was slowly waking up, indifferent to my loneliness.
    `.trim();

    const result = await provider.generateNarrativeAnalysis(sampleText);

    // Validate structure
    expect(result.narratorType).toBeTruthy();
    expect(result.focalization).toBeTruthy();
    expect(result.temporality).toBeTruthy();
    expect(result.chapterStructure).toBeTruthy();
    expect(result.narrativeVoice).toBeInstanceOf(Array);
    expect(result.narrativeVoice.length).toBe(5);
    expect(result.summary).toBeTruthy();

    // Should detect first person narrator
    expect(result.narratorType.toLowerCase()).toMatch(/first|internal/i);
  }, 30000);
});
