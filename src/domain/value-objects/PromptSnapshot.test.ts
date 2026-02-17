// ABOUTME: Tests for PromptSnapshot value object
// ABOUTME: Verifies structure for capturing AI request prompts

import { PromptSnapshot } from './PromptSnapshot';

describe('PromptSnapshot', () => {
  it('should store system prompt, user message, and human-readable summary', () => {
    const snapshot: PromptSnapshot = {
      systemPrompt: 'You are a creative writing assistant...',
      userMessage: 'Generate the next chapter based on the following text...',
      humanReadableSummary: 'Génération complète du chapitre',
    };

    expect(snapshot.systemPrompt).toBe('You are a creative writing assistant...');
    expect(snapshot.userMessage).toBe('Generate the next chapter based on the following text...');
    expect(snapshot.humanReadableSummary).toBe('Génération complète du chapitre');
  });

  it('should support large prompts', () => {
    const largeText = 'A'.repeat(10000);
    const snapshot: PromptSnapshot = {
      systemPrompt: largeText,
      userMessage: largeText,
      humanReadableSummary: 'Test generation',
    };

    expect(snapshot.systemPrompt).toHaveLength(10000);
    expect(snapshot.userMessage).toHaveLength(10000);
  });
});
