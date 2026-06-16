// ABOUTME: Contract tests for the canon-facts extraction prompt
// ABOUTME: Locks conservatism (established facts only, no over-assertion) and required output fields

import { describe, it, expect } from 'vitest';
import { FilePromptRepository } from '../FilePromptRepository';

describe('canon-facts prompt contract', () => {
  const repo = new FilePromptRepository();

  it('restricts extraction to established facts only', async () => {
    const prompt = (await repo.getCanonFactsPrompt()).toLowerCase();
    expect(prompt).toContain('faits établis');
  });

  it('warns against over-asserting ambiguity', async () => {
    const prompt = (await repo.getCanonFactsPrompt()).toLowerCase();
    expect(prompt).toContain('ambigu');
  });

  it('forbids inventing canon', async () => {
    const prompt = (await repo.getCanonFactsPrompt()).toLowerCase();
    expect(prompt).toContain("n'invente rien");
  });

  it('documents the required output fields', async () => {
    const prompt = await repo.getCanonFactsPrompt();
    expect(prompt).toContain('entity');
    expect(prompt).toContain('statement');
    expect(prompt).toContain('validFromChapter');
    expect(prompt).toContain('evidence');
  });
});
