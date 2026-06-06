import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';

describe('OpenAIProvider.generateNarrativeAnalysis (Integration)', () => {
  const apiKey = process.env.OPENAI_API_KEY;

  // Skip this test due to browser-like environment in vitest
  // OpenAI client rejects browser environments for security
  // This test can be run manually in Node environment
  it.skip('should generate real narrative analysis', async () => {
    const provider = new OpenAIProvider(apiKey!, {} as unknown as import('@/domain/interfaces/PromptRepository').PromptRepository, 'gpt-4o-mini');

    const sampleText = `
# Chapitre 1

Je me souviens de ce matin-là. Le soleil perçait à travers les rideaux
de ma chambre d'hôtel, projetant des rectangles de lumière sur le parquet usé.
J'avais mal dormi, comme d'habitude.

Marie était partie avant l'aube, sans un mot. Son parfum flottait encore
dans la pièce, mélangé à l'odeur âcre du café froid sur la table de nuit.

Je me suis levé. J'ai regardé par la fenêtre. Paris s'éveillait lentement,
indifférent à ma solitude.
    `.trim();

    const result = await provider.generateNarrativeAnalysis(sampleText);

    // Validate structure
    expect(result.narratorType).toBeTruthy();
    expect(result.focalization).toBeTruthy();
    expect(result.temporality).toBeTruthy();
    expect(result.chapterStructure).toBeTruthy();
    expect(result.narrativeVoice).toBeInstanceOf(Array);
    expect(result.narrativeVoice.length).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();

    // Should detect first person
    expect(result.narratorType.toLowerCase()).toMatch(/première|first|je/i);
  }, 30000); // 30s timeout for API call
});
