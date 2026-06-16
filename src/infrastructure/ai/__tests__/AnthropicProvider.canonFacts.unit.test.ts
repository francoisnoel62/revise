// ABOUTME: Unit tests for AnthropicProvider.generateCanonFacts
// ABOUTME: Verifies the cast is sent, the canon prompt is used, and JSON is parsed into facts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

describe('AnthropicProvider.generateCanonFacts', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                facts: [
                  { entity: 'Léa', statement: 'est morte', validFromChapter: 2, evidence: 'q' },
                ],
              }),
            },
          ],
          stop_reason: 'end_turn',
        }),
      },
    };
    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {
      getCanonFactsPrompt: vi.fn().mockResolvedValue('Base canon prompt'),
    } as unknown as PromptRepository;

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');
  });

  it('uses the canon prompt, sends the cast, and parses facts', async () => {
    const result = await provider.generateCanonFacts('# Ch1\n\nTexte', ['Léa', 'Tom']);

    expect(mockPromptRepo.getCanonFactsPrompt).toHaveBeenCalled();
    const params = mockClient.messages.create.mock.calls[0][0];
    expect(params.system).toBe('Base canon prompt');
    expect(params.messages[0].content).toContain('PERSONNAGES CONNUS: Léa, Tom');

    expect(result.facts).toEqual([
      { entity: 'Léa', statement: 'est morte', validFromChapter: 2, evidence: 'q' },
    ]);
  });
});
