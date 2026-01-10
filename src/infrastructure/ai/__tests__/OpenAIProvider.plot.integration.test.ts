import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';

describe('OpenAIProvider.generatePlot (Integration)', () => {
  const apiKey = process.env.OPENAI_API_KEY;

  it.skip('should generate real plot analysis', async () => {
    const provider = new OpenAIProvider(apiKey!, 'gpt-4o-mini');

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

    const result = await provider.generatePlot(sampleText);

    // Validate structure
    expect(result.initialSituation).toBeTruthy();
    expect(result.incitingIncident).toBeTruthy();
    expect(result.stakes).toBeTruthy();
    expect(result.dramaticQuestions).toBeTruthy();
    expect(result.conflicts).toBeTruthy();
    expect(result.narrativeThreads).toBeTruthy();
    expect(result.detectedStructure).toBeTruthy();
    expect(result.sceneBreakdown).toBeInstanceOf(Array);
    expect(result.plotState).toBeTruthy();
    expect(result.possibleDirections).toBeTruthy();
    expect(result.summary).toBeTruthy();

    // If scenes detected, validate scene structure
    if (result.sceneBreakdown.length > 0) {
      const scene = result.sceneBreakdown[0];
      expect(scene.chapter).toBeDefined();
      expect(scene.location).toBeDefined();
      expect(scene.characters).toBeDefined();
      expect(scene.objective).toBeDefined();
      expect(scene.conflict).toBeDefined();
      expect(scene.outcome).toBeDefined();
      expect(scene.function).toBeDefined();
    }
  }, 30000);
});
