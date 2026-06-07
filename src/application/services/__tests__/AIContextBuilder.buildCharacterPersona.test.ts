// ABOUTME: Unit tests for AIContextBuilder.buildCharacterPersona()
// ABOUTME: Validates character persona system prompt generation with manuscript context

import { describe, it, expect, vi } from 'vitest';
import { AIContextBuilder } from '../AIContextBuilder';
import { Character } from '../../../domain/entities/Character';

const makeMetadata = (
  typeKey: string,
  opts: { structuredData?: string | null; edited?: boolean; contentText?: string }
) => ({
  getTypeKey: () => typeKey,
  getStructuredData: () => opts.structuredData ?? null,
  wasEditedSinceGeneration: () => opts.edited ?? false,
  getContentText: () => opts.contentText ?? '',
});

const mockRepo = (items: ReturnType<typeof makeMetadata>[]) => ({
  findByProjectId: vi.fn().mockResolvedValue(items),
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectAndType: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

const makeCharacter = (opts: {
  name?: string;
  identity?: string;
  psychology?: string;
  voiceAndLanguage?: string;
  backstory?: string;
  relationships?: string;
  openQuestions?: string;
} = {}): Character => {
  let char = Character.create('c1', 'p1', 'u1', opts.name ?? 'Élise');
  if (opts.identity) char = char.updateIdentity(opts.identity);
  if (opts.psychology) char = char.updatePsychology(opts.psychology);
  if (opts.voiceAndLanguage) char = char.updateVoiceAndLanguage(opts.voiceAndLanguage);
  if (opts.backstory) char = char.updateBackstory(opts.backstory);
  if (opts.relationships) char = char.updateRelationships(opts.relationships);
  if (opts.openQuestions) char = char.updateOpenQuestions(opts.openQuestions);
  return char;
};

const narrative = {
  narratorType: 'Third person',
  focalization: 'Internal',
  temporality: 'Past',
  chapterStructure: '',
  narrativeVoice: ['Irony'],
  summary: '',
};

describe('AIContextBuilder.buildCharacterPersona', () => {
  it('returns a non-empty string for a complete character', async () => {
    const builder = new AIContextBuilder(mockRepo([]) as never);
    const char = makeCharacter({ identity: 'Protagonist', psychology: 'Brave' });

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the character name in the prompt', async () => {
    const builder = new AIContextBuilder(mockRepo([]) as never);
    const char = makeCharacter({ name: 'Héloïse' });

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result).toContain('Héloïse');
  });

  it('includes the absolute rule about not fabricating canon', async () => {
    const builder = new AIContextBuilder(mockRepo([]) as never);
    const char = makeCharacter();

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result).toContain('Ne fabrique jamais de canon');
  });

  it('omits empty character fields from the sheet', async () => {
    const builder = new AIContextBuilder(mockRepo([]) as never);
    const char = Character.create('c1', 'p1', 'u1', 'Élise');

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result).not.toContain('Identité :');
    expect(result).not.toContain('Psychologie :');
  });

  it('truncates long character fields', async () => {
    const builder = new AIContextBuilder(mockRepo([]) as never);
    const longText = 'x'.repeat(1000);
    const char = makeCharacter({ identity: longText });

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result).toContain('…');
    const identityLine = result.split('\n').find((l) => l.startsWith('Identité :'));
    expect(identityLine).toBeDefined();
    expect(identityLine!.length).toBeLessThan(longText.length);
  });

  it('works without any manuscript metadata', async () => {
    const builder = new AIContextBuilder(mockRepo([]) as never);
    const char = makeCharacter({ identity: 'Hero' });

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result).toContain('FICHE DU PERSONNAGE');
    expect(result).toContain('RÈGLES ABSOLUES');
    expect(result).not.toContain('CONTEXTE DU ROMAN');
  });

  it('includes manuscript context when narrative analysis is available', async () => {
    const repo = mockRepo([
      makeMetadata('narrative-analysis', { structuredData: JSON.stringify(narrative) }),
    ]);
    const builder = new AIContextBuilder(repo as never);
    const char = makeCharacter();

    const result = await builder.buildCharacterPersona(char, 'u1', 'p1');

    expect(result).toContain('CONTEXTE DU ROMAN');
  });
});
