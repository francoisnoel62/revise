// ABOUTME: Integration tests for AI usage tracking wiring
// ABOUTME: Verifies that tracked providers are correctly created and wired

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackedLLMProvider } from '@/infrastructure/ai/TrackedLLMProvider';
import { getModelPricingRepository } from '@/infrastructure/config/providers';

// Mock infrastructure dependencies
vi.mock('@/infrastructure/config/providers', () => ({
  getProviderRepository: vi.fn().mockResolvedValue({
    findById: vi.fn().mockResolvedValue({
      isValidProvider: () => true,
      getProviderType: () => 'OpenAI',
      getApiKey: () => 'test-key',
      getModel: () => 'gpt-4o-mini',
    }),
  }),
  getProjectRepository: vi.fn().mockResolvedValue({
    loadProject: vi.fn().mockResolvedValue({
      getProviderId: () => 'provider-123',
    }),
  }),
  createLLMProvider: vi.fn().mockReturnValue({
    generateRewrites: vi.fn(),
    testConnection: vi.fn(),
    getProviderName: () => 'OpenAI',
    getModel: () => 'gpt-4o-mini',
    generateNarrativeAnalysis: vi.fn(),
    generateStylisticDNA: vi.fn(),
    generateCharacters: vi.fn(),
    generatePlot: vi.fn(),
    generateWorldbuilding: vi.fn(),
    generateSynthesis: vi.fn(),
    generateChapterSummaries: vi.fn(),
    generateChapter: vi.fn(),
    generateCompletion: vi.fn(),
    generateCompletionStream: vi.fn(),
  }),
  getAIUsageRepository: vi.fn().mockResolvedValue({
    save: vi.fn(),
    findByProject: vi.fn(),
    getStatsByProject: vi.fn(),
    getDailyUsageByProject: vi.fn(),
    getStatsForUser: vi.fn(),
    deleteAllByOwner: vi.fn(),
  }),
  // The tracked provider resolves the user's opt-in for exchange logging.
  // Default: no user / logging disabled, so no exchange repository is needed.
  getUserRepository: vi.fn().mockResolvedValue({
    findById: vi.fn().mockResolvedValue(null),
  }),
  getAIExchangeRepository: vi.fn().mockResolvedValue({
    save: vi.fn(),
    findByOwner: vi.fn(),
    findById: vi.fn(),
    deleteAllByOwner: vi.fn(),
    ensureIndexes: vi.fn(),
  }),
  // The tracked provider needs the pricing repository to compute euro costs.
  getModelPricingRepository: vi.fn().mockResolvedValue({
    findAll: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('@/infrastructure/utils/ObjectIdGenerator', () => ({
  objectIdGenerator: {
    generate: () => '507f1f77bcf86cd799439011',
  },
}));

// Mock database connection
vi.mock('@/infrastructure/persistence/MongoDBConnection', () => ({
  getDatabase: vi.fn().mockReturnValue({}),
}));

describe('AI Usage Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTrackedLLMProviderForProject', () => {
    it('returns a TrackedLLMProvider instance', async () => {
      // Import after mocks are set up
      const { getTrackedLLMProviderForProject } = await import('../utils');

      const provider = await getTrackedLLMProviderForProject('user-1', 'project-1');

      expect(provider).toBeInstanceOf(TrackedLLMProvider);
    }, 15000);

    it('wraps the base provider with tracking', async () => {
      const { getTrackedLLMProviderForProject } = await import('../utils');

      const provider = await getTrackedLLMProviderForProject('user-1', 'project-1');

      // TrackedLLMProvider should have all LLMProvider methods
      expect(typeof provider.generateRewrites).toBe('function');
      expect(typeof provider.generateNarrativeAnalysis).toBe('function');
      expect(typeof provider.generateStylisticDNA).toBe('function');
      expect(typeof provider.generateCharacters).toBe('function');
      expect(typeof provider.generatePlot).toBe('function');
      expect(typeof provider.generateWorldbuilding).toBe('function');
      expect(typeof provider.generateSynthesis).toBe('function');
      expect(typeof provider.generateChapterSummaries).toBe('function');
      expect(typeof provider.generateChapter).toBe('function');
      expect(typeof provider.generateCompletion).toBe('function');
    });

    it('wires the pricing repository so euro costs can be computed', async () => {
      const { getTrackedLLMProviderForProject } = await import('../utils');

      await getTrackedLLMProviderForProject('user-1', 'project-1');

      expect(getModelPricingRepository).toHaveBeenCalled();
    });
  });

  describe('getTrackedLLMProviderById', () => {
    it('returns a TrackedLLMProvider instance', async () => {
      const { getTrackedLLMProviderById } = await import('../utils');

      const provider = await getTrackedLLMProviderById('user-1', 'provider-1', 'project-1');

      expect(provider).toBeInstanceOf(TrackedLLMProvider);
    });

    it('wraps the specified provider with tracking', async () => {
      const { getTrackedLLMProviderById } = await import('../utils');

      const provider = await getTrackedLLMProviderById('user-1', 'provider-1', 'project-1');

      // TrackedLLMProvider should have all LLMProvider methods
      expect(typeof provider.generateRewrites).toBe('function');
      expect(typeof provider.generateCompletion).toBe('function');
    });

    it('wires the pricing repository so euro costs can be computed', async () => {
      const { getTrackedLLMProviderById } = await import('../utils');

      await getTrackedLLMProviderById('user-1', 'provider-1', 'project-1');

      expect(getModelPricingRepository).toHaveBeenCalled();
    });
  });

  describe('Server action imports use tracked providers', () => {
    it('rewrite-text imports getTrackedLLMProviderForProject', async () => {
      // Read the source file to verify the import
      const fs = await import('fs/promises');
      const path = await import('path');

      const rewriteTextPath = path.join(process.cwd(), 'src/app/actions/rewrite-text.ts');
      const content = await fs.readFile(rewriteTextPath, 'utf-8');

      expect(content).toContain('getTrackedLLMProviderForProject');
      expect(content).not.toMatch(/createLLMProvider\(provider\)/);
    });

    it('metadata-actions imports getTrackedLLMProviderForProject', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const metadataActionsPath = path.join(process.cwd(), 'src/app/actions/metadata-actions.ts');
      const content = await fs.readFile(metadataActionsPath, 'utf-8');

      expect(content).toContain('getTrackedLLMProviderForProject');
      expect(content).toContain('getTrackedLLMProviderById');
      expect(content).not.toContain('getLLMProviderForProject');
    });

    it('completion-actions imports getTrackedLLMProviderForProject', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const completionActionsPath = path.join(process.cwd(), 'src/app/actions/completion-actions.ts');
      const content = await fs.readFile(completionActionsPath, 'utf-8');

      expect(content).toContain('getTrackedLLMProviderForProject');
      expect(content).not.toContain('getLLMProviderForProject');
    });

    it('chapter-generation-actions imports getTrackedLLMProviderForProject', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const chapterActionsPath = path.join(process.cwd(), 'src/app/actions/chapter-generation-actions.ts');
      const content = await fs.readFile(chapterActionsPath, 'utf-8');

      expect(content).toContain('getTrackedLLMProviderForProject');
      expect(content).toContain('getTrackedLLMProviderById');
      expect(content).not.toContain('getLLMProviderForProject');
    });
  });
});
