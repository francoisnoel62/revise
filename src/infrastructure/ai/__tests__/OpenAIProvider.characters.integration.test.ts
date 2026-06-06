import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';

describe('OpenAIProvider.generateCharacters (Integration)', () => {
  const apiKey = process.env.OPENAI_API_KEY;

  it.skip('should generate real character analysis', async () => {
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

    const result = await provider.generateCharacters(sampleText);

    // Validate structure
    expect(result.characterProfiles).toBeInstanceOf(Array);
    expect(result.relationalMap).toBeTruthy();
    expect(result.narrativeHierarchy).toBeTruthy();
    expect(result.summary).toBeTruthy();

    // If characters detected, validate profile structure
    if (result.characterProfiles.length > 0) {
      const profile = result.characterProfiles[0];
      expect(profile.name).toBeTruthy();
      expect(profile.identity).toBeDefined();
      expect(profile.appearance).toBeDefined();
      expect(profile.psychology).toBeDefined();
      expect(profile.voiceAndLanguage).toBeDefined();
      expect(profile.backstory).toBeDefined();
      expect(profile.relationships).toBeDefined();
      expect(profile.narrativeFunction).toBeDefined();
      expect(profile.openQuestions).toBeDefined();
    }
  }, 30000);
});
