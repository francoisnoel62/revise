// ABOUTME: Test suite for RewriteTextUseCase validating text rewriting orchestration
// ABOUTME: Tests use case coordination between TextDocument and LLMProvider using test doubles

import { describe, it, expect, beforeEach } from 'vitest';
import { RewriteTextUseCase } from './RewriteTextUseCase';
import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';

import { vi } from 'vitest';
import { StylisticDNA } from '@/domain/value-objects/StylisticDNA';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';

// Test double for LLMProvider
class MockLLMProvider implements LLMProvider {
  private mockProposals: RewriteProposal[] = [];

  setMockProposals(proposals: RewriteProposal[]): void {
    this.mockProposals = proposals;
  }

  async generateRewrites(_text: string, _context?: string, _metadata?: unknown): Promise<RewriteProposal[]> {
    return this.mockProposals;
  }

  async testConnection() {
    return { valid: true };
  }

  getProviderName() {
    return 'Mock';
  }

  getModel() {
    return 'mock-model';
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
      async testConnection() {
        return { valid: true };
      },
      getProviderName() {
        return 'Custom';
      },
      getModel() {
        return 'custom-model';
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
      async testConnection() {
        return { valid: true };
      },
      getProviderName() {
        return 'Custom';
      },
      getModel() {
        return 'custom-model';
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
      async testConnection() {
        return { valid: true };
      },
      getProviderName() {
        return 'Failing';
      },
      getModel() {
        return 'failing-model';
      },
    };
    const failingUseCase = new RewriteTextUseCase(failingProvider);

    await expect(async () => {
      await failingUseCase.execute(document, selection);
    }).rejects.toThrow('API unavailable');
  });

  describe('executeWithText', () => {
    it('should generate rewrites for directly provided text', async () => {
      const selectedText = 'quick';
      const fullContext = 'The quick brown fox jumps over the lazy dog.';

      const mockProposals = [
        new RewriteProposal('fast', 'concise'),
        new RewriteProposal('speedy', 'informal'),
        new RewriteProposal('swift', 'formal'),
        new RewriteProposal('rapid', 'technical'),
        new RewriteProposal('hasty', 'negative'),
      ];
      mockProvider.setMockProposals(mockProposals);

      const result = await useCase.executeWithText(selectedText, fullContext);

      expect(result).toHaveLength(5);
      expect(result).toEqual(mockProposals);
    });

    it('should pass text directly to LLM provider (avoiding position extraction)', async () => {
      let capturedText = '';
      let capturedContext = '';

      const customProvider: LLMProvider = {
        async generateRewrites(text: string, context?: string) {
          capturedText = text;
          capturedContext = context || '';
          return [
            new RewriteProposal('rewritten', 'style'),
          ];
        },
        async testConnection() {
          return { valid: true };
        },
        getProviderName() {
          return 'Custom';
        },
        getModel() {
          return 'custom-model';
        },
      };
      const customUseCase = new RewriteTextUseCase(customProvider);

      await customUseCase.executeWithText('selected text', 'full document context');

      expect(capturedText).toBe('selected text');
      expect(capturedContext).toBe('full document context');
    });

    it('should throw error for empty selected text', async () => {
      await expect(async () => {
        await useCase.executeWithText('', 'context');
      }).rejects.toThrow('Cannot rewrite empty selection');
    });

    it('should throw error for whitespace-only selected text', async () => {
      await expect(async () => {
        await useCase.executeWithText('   ', 'context');
      }).rejects.toThrow('Cannot rewrite empty selection');
    });

    it('should work correctly with TipTap-extracted text (regression test)', async () => {
      // This test simulates the fix for the JSON/text position mismatch bug.
      // When content is stored as TipTap JSON, editor positions don't match
      // JSON string positions. The solution is to extract text directly from
      // TipTap editor and pass it to executeWithText.

      // Simulated TipTap JSON (what's stored in the database)
      const tiptapJson = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}';

      // Plain text extracted from TipTap editor using doc.textBetween()
      const selectedText = 'Hello';
      const plainTextContext = 'Hello world'; // Extracted from JSON

      let capturedText = '';
      const customProvider: LLMProvider = {
        async generateRewrites(text: string) {
          capturedText = text;
          return [new RewriteProposal('Bonjour', 'french')];
        },
        async testConnection() {
          return { valid: true };
        },
        getProviderName() {
          return 'Test';
        },
        getModel() {
          return 'test-model';
        },
      };

      const customUseCase = new RewriteTextUseCase(customProvider);
      const result = await customUseCase.executeWithText(selectedText, plainTextContext);

      // Verify that the actual selected text is passed, not garbage from JSON
      expect(capturedText).toBe('Hello');
      expect(result[0].content).toBe('Bonjour');

      // Demonstrate the bug: using positions on JSON string would fail
      const brokenSelection = new TextSelection(0, 5); // Would get '{"typ' from JSON
      const brokenText = tiptapJson.substring(brokenSelection.start, brokenSelection.end);
      expect(brokenText).toBe('{"typ'); // This proves the bug - positions don't align!
      expect(brokenText).not.toBe('Hello');
    });

    it('should pass metadata to llmProvider.generateRewrites', async () => {
      const mockGenerate = vi.fn().mockResolvedValue([new RewriteProposal('result', 'style')]);
      const providerWithMetadata = {
        generateRewrites: mockGenerate,
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('Mock'),
        getModel: vi.fn().mockReturnValue('mock'),
      } as unknown as LLMProvider;

      const stylisticDNA: StylisticDNA = {
        registerAndLexicon: 'Literary',
        syntax: 'Complex',
        figuresOfStyle: '',
        ticsAndSignatures: '',
        rhythmAndBreathing: 'Slow',
        writingRules: ['Rule 1', 'Rule 2'],
        summary: '',
      };

      const caseWithMeta = new RewriteTextUseCase(providerWithMetadata);
      await caseWithMeta.executeWithText('text', 'context', { stylisticDNA });

      expect(mockGenerate).toHaveBeenCalledWith('text', 'context', { stylisticDNA });
    });

    it('should work without metadata (undefined) — unchanged behavior', async () => {
      const mockGenerate = vi.fn().mockResolvedValue([new RewriteProposal('result', 'style')]);
      const provider = {
        generateRewrites: mockGenerate,
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('Mock'),
        getModel: vi.fn().mockReturnValue('mock'),
      } as unknown as LLMProvider;

      const caseNoMeta = new RewriteTextUseCase(provider);
      await caseNoMeta.executeWithText('text', 'context');

      expect(mockGenerate).toHaveBeenCalledWith('text', 'context', undefined);
    });

    it('should pass both stylisticDNA and narrative when both provided', async () => {
      const mockGenerate = vi.fn().mockResolvedValue([new RewriteProposal('result', 'style')]);
      const provider = {
        generateRewrites: mockGenerate,
        testConnection: vi.fn().mockResolvedValue({ valid: true }),
        getProviderName: vi.fn().mockReturnValue('Mock'),
        getModel: vi.fn().mockReturnValue('mock'),
      } as unknown as LLMProvider;

      const narrative: NarrativeAnalysis = {
        narratorType: 'Third person',
        focalization: 'External',
        temporality: 'Past',
        chapterStructure: 'Short',
        narrativeVoice: ['Detached'],
        summary: '',
      };
      const stylisticDNA: StylisticDNA = {
        registerAndLexicon: 'Informal',
        syntax: 'Simple',
        figuresOfStyle: '',
        ticsAndSignatures: '',
        rhythmAndBreathing: 'Fast',
        writingRules: [],
        summary: '',
      };

      const caseWithBoth = new RewriteTextUseCase(provider);
      await caseWithBoth.executeWithText('text', 'context', { narrative, stylisticDNA });

      expect(mockGenerate).toHaveBeenCalledWith('text', 'context', { narrative, stylisticDNA });
    });
  });
});
