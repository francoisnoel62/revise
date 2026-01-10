import { describe, it, expect } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';

describe('AnthropicProvider.generateSynthesis (Integration)', () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  it.skip('should generate real synthesis analysis', async () => {
    const provider = new AnthropicProvider(apiKey!, 'claude-3-5-sonnet-20241022');

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

    // Empty previous analyses (synthesis can work without them)
    const previousAnalyses = {};

    const result = await provider.generateSynthesis(sampleText, previousAnalyses);

    // Validate structure
    expect(result.textIdentity).toBeTruthy();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.improvements).toBeInstanceOf(Array);
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(result.internalCoherence).toBeTruthy();
    expect(result.stylisticCharter).toBeInstanceOf(Array);
    expect(result.stylisticCharter.length).toBeGreaterThan(0);
    expect(result.plotSummary).toBeTruthy();
    expect(result.openQuestions).toBeInstanceOf(Array);
    expect(result.characterSummaries).toBeInstanceOf(Array);
    expect(result.readerPromises).toBeInstanceOf(Array);
    expect(result.narrativeDirections).toBeInstanceOf(Array);
    expect(result.suggestedScenes).toBeInstanceOf(Array);
    expect(result.charactersToDevelop).toBeTruthy();
    expect(result.alerts).toBeInstanceOf(Array);

    // If narrative directions detected, validate structure
    if (result.narrativeDirections.length > 0) {
      const direction = result.narrativeDirections[0];
      expect(direction.direction).toBeTruthy();
      expect(direction.advantages).toBeTruthy();
      expect(direction.risks).toBeTruthy();
    }

    // If character summaries detected, validate structure
    if (result.characterSummaries.length > 0) {
      const char = result.characterSummaries[0];
      expect(char.name).toBeTruthy();
      expect(char.role).toBeDefined();
      expect(char.motivation).toBeDefined();
      expect(char.flaw).toBeDefined();
      expect(char.lastSituation).toBeDefined();
    }
  }, 30000);
});
