// ABOUTME: Test suite for RewriteTextUseCase validating text rewriting orchestration
// ABOUTME: Tests use case coordination between TextDocument and LLMProvider using test doubles

import { describe, it, expect, beforeEach } from 'vitest';
import { RewriteTextUseCase } from './RewriteTextUseCase';
import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';

// Test double for LLMProvider
class MockLLMProvider implements LLMProvider {
  private mockProposals: RewriteProposal[] = [];

  setMockProposals(proposals: RewriteProposal[]): void {
    this.mockProposals = proposals;
  }

  async generateRewrites(text: string, context?: string): Promise<RewriteProposal[]> {
    return this.mockProposals;
  }
}

describe('RewriteTextUseCase', () => {
  let mockProvider: MockLLMProvider;
  let useCase: RewriteTextUseCase;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    useCase = new RewriteTextUseCase(mockProvider);
  });

  it('should generate rewrites for selected text', async () => {
    const document = new TextDocument('The quick brown fox jumps over the lazy dog.');
    const selection = new TextSelection(4, 9); // "quick"

    const mockProposals = [
      new RewriteProposal('fast', 'concise'),
      new RewriteProposal('speedy', 'informal'),
      new RewriteProposal('swift', 'formal'),
      new RewriteProposal('rapid', 'technical'),
      new RewriteProposal('hasty', 'negative'),
    ];
    mockProvider.setMockProposals(mockProposals);

    const result = await useCase.execute(document, selection);

    expect(result).toHaveLength(5);
    expect(result).toEqual(mockProposals);
  });

  it('should pass selected text to LLM provider', async () => {
    const document = new TextDocument('Hello, world! This is a test.');
    const selection = new TextSelection(0, 13); // "Hello, world!"

    let capturedText = '';
    const customProvider: LLMProvider = {
      async generateRewrites(text: string) {
        capturedText = text;
        return [
          new RewriteProposal('Greetings, planet!'),
          new RewriteProposal('Hi there!'),
          new RewriteProposal('Good day!'),
          new RewriteProposal('Salutations!'),
          new RewriteProposal('Hey!'),
        ];
      },
    };
    const customUseCase = new RewriteTextUseCase(customProvider);

    await customUseCase.execute(document, selection);

    expect(capturedText).toBe('Hello, world!');
  });

  it('should include surrounding context when available', async () => {
    const document = new TextDocument('The quick brown fox jumps over the lazy dog.');
    const selection = new TextSelection(10, 15); // "brown"

    let capturedContext: string | undefined;
    const customProvider: LLMProvider = {
      async generateRewrites(text: string, context?: string) {
        capturedContext = context;
        return [
          new RewriteProposal('red'),
          new RewriteProposal('dark'),
          new RewriteProposal('chestnut'),
          new RewriteProposal('tawny'),
          new RewriteProposal('russet'),
        ];
      },
    };
    const customUseCase = new RewriteTextUseCase(customProvider);

    await customUseCase.execute(document, selection);

    expect(capturedContext).toBe('The quick brown fox jumps over the lazy dog.');
  });

  it('should throw error for empty selection', async () => {
    const document = new TextDocument('Some text');
    const selection = new TextSelection(5, 5); // Empty selection

    await expect(async () => {
      await useCase.execute(document, selection);
    }).rejects.toThrow('Cannot rewrite empty selection');
  });

  it('should propagate LLM provider errors', async () => {
    const document = new TextDocument('Test content');
    const selection = new TextSelection(0, 4);

    const failingProvider: LLMProvider = {
      async generateRewrites() {
        throw new Error('API unavailable');
      },
    };
    const failingUseCase = new RewriteTextUseCase(failingProvider);

    await expect(async () => {
      await failingUseCase.execute(document, selection);
    }).rejects.toThrow('API unavailable');
  });
});
