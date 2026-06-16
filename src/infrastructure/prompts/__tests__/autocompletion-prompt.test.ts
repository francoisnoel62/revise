// ABOUTME: Contract tests for the autocompletion prompt
// ABOUTME: Locks the manuscript-first invariants (minimal continuation, no metadata, explicit bans)

import { describe, it, expect } from 'vitest';
import { FilePromptRepository } from '../FilePromptRepository';

describe('autocompletion prompt contract', () => {
  const repo = new FilePromptRepository();

  it('asks for the minimal necessary continuation', async () => {
    const prompt = await repo.getCompletionPrompt();
    expect(prompt.toLowerCase()).toContain('suite minimale');
  });

  it('no longer injects derived metadata into the writing prompt', async () => {
    const prompt = await repo.getCompletionPrompt();
    expect(prompt).not.toContain('[MÉTADONNÉES]');
  });

  it('states the core bans (summarize / resolve / point of view / canon)', async () => {
    const prompt = (await repo.getCompletionPrompt()).toLowerCase();
    expect(prompt).toContain('résume');
    expect(prompt).toContain('résous');
    expect(prompt).toContain('point de vue');
    expect(prompt).toContain('canon');
  });

  it('requires always proposing a continuation (no empty return)', async () => {
    const prompt = (await repo.getCompletionPrompt()).toLowerCase();
    expect(prompt).toContain('toujours proposer');
  });
});
