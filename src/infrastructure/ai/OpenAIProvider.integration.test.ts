// ABOUTME: Integration tests for OpenAIProvider with real OpenAI API calls
// ABOUTME: Validates end-to-end behavior with actual API - skip if OPENAI_API_KEY not set

import { describe, it, expect, beforeAll } from 'vitest';
import { OpenAIProvider } from './OpenAIProvider';

describe.skipIf(!process.env.OPENAI_API_KEY)('OpenAIProvider Integration', () => {
  let provider: OpenAIProvider;

  beforeAll(() => {
    const apiKey = process.env.OPENAI_API_KEY!;
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    provider = new OpenAIProvider(apiKey, model);
  });

  it('should generate 5 distinct proposals with real API', async () => {
    const text = 'The meeting was productive and we made good progress.';

    const proposals = await provider.generateRewrites(text);

    expect(proposals).toHaveLength(5);

    // All proposals should have content
    proposals.forEach((proposal) => {
      expect(proposal.content.length).toBeGreaterThan(0);
    });

    // Proposals should be genuinely different
    const uniqueContents = new Set(proposals.map((p) => p.content));
    expect(uniqueContents.size).toBe(5);

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
        content.includes('due')
      ).toBe(true);
    });
  }, 30000);

  it('should use context for better understanding', async () => {
    const selectedText = 'it';
    const fullContext = 'The new software release is scheduled for Monday. It will include major improvements.';

    const proposals = await provider.generateRewrites(selectedText, fullContext);

    expect(proposals).toHaveLength(5);

    // Proposals should understand "it" refers to the software release
    proposals.forEach((proposal) => {
      expect(proposal.content.length).toBeGreaterThan(2); // More than just "it"
    });
  }, 30000);

  it('should handle longer text passages', async () => {
    const text = `The research indicates that collaborative teams perform better when
    they have clear communication channels and well-defined roles. This finding
    has important implications for organizational structure.`;

    const proposals = await provider.generateRewrites(text);

    expect(proposals).toHaveLength(5);

    // All proposals should be substantive
    proposals.forEach((proposal) => {
      expect(proposal.content.length).toBeGreaterThan(50);
    });
  }, 30000);
});
