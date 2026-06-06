import { describe, it, expect } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';

describe('AnthropicProvider.generateWorldbuilding (Integration)', () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  it.skip('should generate real worldbuilding analysis', async () => {
    const provider = new AnthropicProvider(apiKey!, {} as unknown as import('@/domain/interfaces/PromptRepository').PromptRepository, 'claude-3-5-sonnet-20241022');

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

    const result = await provider.generateWorldbuilding(sampleText);

    // Validate structure
    expect(result.explicitThemes).toBeTruthy();
    expect(result.implicitThemes).toBeTruthy();
    expect(result.symbolism).toBeTruthy();
    expect(result.subtext).toBeTruthy();
    expect(result.worldview).toBeTruthy();
    expect(result.intertextuality).toBeTruthy();
    expect(result.spatiotemporalSetting).toBeTruthy();
    expect(result.atmosphere).toBeTruthy();
    expect(result.worldRules).toBeTruthy();
    expect(result.socialContext).toBeTruthy();
    expect(result.immersionDetails).toBeTruthy();
    expect(result.coherence).toBeTruthy();
    expect(result.summary).toBeTruthy();
  }, 30000);
});
