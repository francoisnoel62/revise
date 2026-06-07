// ABOUTME: Integration tests for AnthropicProvider with real Anthropic Claude API calls
// ABOUTME: Validates end-to-end behavior with actual API - skip if ANTHROPIC_API_KEY not set

// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest';
import { AnthropicProvider } from './AnthropicProvider';
import { FilePromptRepository } from '@/infrastructure/prompts/FilePromptRepository';

describe.skipIf(!process.env.ANTHROPIC_API_KEY || !process.env.ANTHROPIC_INTEGRATION_TESTS)('AnthropicProvider Integration', () => {
  let provider: AnthropicProvider;

  beforeAll(() => {
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    const promptRepo = new FilePromptRepository();
    provider = new AnthropicProvider(apiKey, promptRepo, model);
  });

  it('should generate 3 distinct proposals with real API', async () => {
    const text = 'The meeting was productive and we made good progress.';

    const proposals = await provider.generateRewrites(text);

    expect(proposals).toHaveLength(3);

    // All proposals should have content
    proposals.forEach((proposal) => {
      expect(proposal.content.length).toBeGreaterThan(0);
    });

    // Proposals should be genuinely different
    const uniqueContents = new Set(proposals.map((p) => p.content));
    expect(uniqueContents.size).toBe(3);

    // At least some proposals should have style labels
    const withLabels = proposals.filter((p) => p.styleLabel);
    expect(withLabels.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for API call

  it('should maintain meaning across proposals', async () => {
    const text = 'The project deadline is next Friday.';

    const proposals = await provider.generateRewrites(text);

    // All proposals should mention timing/deadline
    proposals.forEach((proposal) => {
      const content = proposal.content.toLowerCase();
      expect(
        content.includes('friday') ||
        content.includes('deadline') ||
        content.includes('next week') ||
        content.includes('vendredi') || // French variant
        content.includes('échéance') ||
        content.includes('due')
      ).toBe(true);
    });
  }, 30000);

  it('should accept context parameter without error', async () => {
    // Test that the provider can handle context parameter
    // Using a more concrete phrase that the AI should meaningfully rewrite
    const selectedText = 'the release';
    const fullContext = 'The new software release is scheduled for Monday. It will include major improvements.';

    const proposals = await provider.generateRewrites(selectedText, fullContext);

    expect(proposals).toHaveLength(3);

    // Verify we get valid non-empty proposals
    proposals.forEach((proposal) => {
      expect(proposal.content).toBeDefined();
      expect(proposal.content.length).toBeGreaterThan(0);
    });

    // Proposals should all be different from each other (AI generates variations)
    const uniqueContents = new Set(proposals.map((p) => p.content));
    expect(uniqueContents.size).toBe(3);
  }, 30000);

  it('should handle longer text passages', async () => {
    const text = `The research indicates that collaborative teams perform better when
    they have clear communication channels and well-defined roles. This finding
    has important implications for organizational structure.`;

    const proposals = await provider.generateRewrites(text);

    expect(proposals).toHaveLength(3);

    // All proposals should be substantive
    proposals.forEach((proposal) => {
      expect(proposal.content.length).toBeGreaterThan(50);
    });
  }, 30000);

  it('should preserve language in proposals', async () => {
    const frenchText = 'Le projet avance bien et nous sommes satisfaits des résultats.';

    const proposals = await provider.generateRewrites(frenchText);

    expect(proposals).toHaveLength(3);

    // All proposals should be in French (contain common French words)
    proposals.forEach((proposal) => {
      const content = proposal.content.toLowerCase();
      // Check for French articles, prepositions, or specific French words
      expect(
        content.includes('le ') ||
        content.includes('la ') ||
        content.includes('les ') ||
        content.includes('nous') ||
        content.includes('projet') ||
        content.includes('bien') ||
        content.includes('des')
      ).toBe(true);
    });
  }, 30000);

  it('should handle testConnection successfully', async () => {
    const result = await provider.testConnection();

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  }, 15000);
});
