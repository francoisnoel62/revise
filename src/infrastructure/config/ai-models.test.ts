// ABOUTME: Tests for AI model configuration
// ABOUTME: Validates that all expected models are present with correct properties

import { describe, it, expect } from 'vitest';
import { AI_MODELS, getModelsForProvider, getDefaultModel, getModelInfo } from './ai-models';

describe('AI_MODELS', () => {
  describe('anthropic models', () => {
    it('should have 4 models', () => {
      expect(AI_MODELS.anthropic).toHaveLength(4);
    });

    it('should include Claude Opus 4.6', () => {
      const opus46 = AI_MODELS.anthropic.find((m) => m.id === 'claude-opus-4-6');
      expect(opus46).toBeDefined();
    });

    it('should have correct properties for Claude Opus 4.6', () => {
      const opus46 = AI_MODELS.anthropic.find((m) => m.id === 'claude-opus-4-6');
      expect(opus46).toEqual({
        id: 'claude-opus-4-6',
        name: 'Claude Opus 4.6',
        description: 'Flagship model with adaptive thinking and 128K output',
        contextWindow: 200000,
      });
    });

    it('should still recommend Claude Sonnet 4.5 as default', () => {
      const defaultModel = getDefaultModel('anthropic');
      expect(defaultModel).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('getModelInfo', () => {
    it('should return Claude Opus 4.6 info', () => {
      const info = getModelInfo('anthropic', 'claude-opus-4-6');
      expect(info).toBeDefined();
      expect(info?.name).toBe('Claude Opus 4.6');
    });
  });

  describe('getModelsForProvider', () => {
    it('should return all anthropic models including Opus 4.6', () => {
      const models = getModelsForProvider('anthropic');
      const ids = models.map((m) => m.id);
      expect(ids).toContain('claude-opus-4-6');
    });
  });
});
