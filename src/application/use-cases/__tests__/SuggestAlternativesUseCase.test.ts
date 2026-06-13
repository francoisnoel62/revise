// ABOUTME: Unit tests for SuggestAlternativesUseCase
// ABOUTME: Covers guard clauses, layer 1 only path, layer 1+2 path, and voiceAnchored logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuggestAlternativesUseCase } from '../SuggestAlternativesUseCase';
import { LLMProvider } from '../../../domain';
import { AIContextBuilder } from '../../services/AIContextBuilder';
import { Thesaurus } from '../../../domain/interfaces/Thesaurus';
import { createWordAlternative } from '../../../domain/value-objects/WordAlternative';

const LAYER1_SYNONYMS = ['observer', 'scruter', 'épier', 'contempler'];

const LAYER2_ALTERNATIVES = [
  createWordAlternative({ word: 'épier', sceneEffect: 'installe une menace silencieuse' }),
  createWordAlternative({ word: 'scruter', sceneEffect: "accentue l'intensité du regard" }),
];

describe('SuggestAlternativesUseCase', () => {
  let mockContextBuilder: AIContextBuilder;
  let mockLLMProvider: LLMProvider;
  let mockThesaurus: Thesaurus;
  let useCase: SuggestAlternativesUseCase;

  beforeEach(() => {
    mockThesaurus = {
      lookup: vi.fn().mockResolvedValue(LAYER1_SYNONYMS),
    };

    mockContextBuilder = {
      buildRewriteContext: vi.fn().mockResolvedValue('Registre épuré, phrases courtes.'),
      buildCompletionContext: vi.fn(),
    } as unknown as AIContextBuilder;

    mockLLMProvider = {
      suggestAlternatives: vi.fn().mockResolvedValue(LAYER2_ALTERNATIVES),
    } as unknown as LLMProvider;

    useCase = new SuggestAlternativesUseCase(
      mockContextBuilder,
      mockLLMProvider,
      mockThesaurus
    );
  });

  // ── Guard clauses ──────────────────────────────────────────────────────────

  it('throws when ownerId is empty', async () => {
    await expect(
      useCase.execute({ ownerId: '', projectId: 'p1', word: 'regarder', sentence: 'Elle regardait.' })
    ).rejects.toThrow('Owner ID is required');
  });

  it('throws when projectId is empty', async () => {
    await expect(
      useCase.execute({ ownerId: 'u1', projectId: '', word: 'regarder', sentence: 'Elle regardait.' })
    ).rejects.toThrow('Project ID is required');
  });

  it('throws when word is empty', async () => {
    await expect(
      useCase.execute({ ownerId: 'u1', projectId: 'p1', word: '', sentence: 'Elle regardait.' })
    ).rejects.toThrow('Word is required');
  });

  it('throws when sentence is empty', async () => {
    await expect(
      useCase.execute({ ownerId: 'u1', projectId: 'p1', word: 'regarder', sentence: '' })
    ).rejects.toThrow('Sentence is required');
  });

  // ── Layer 1 only (default) ─────────────────────────────────────────────────

  it('returns layer1 synonyms without AI call when includeAILayer is absent', async () => {
    const result = await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait depuis la fenêtre.',
    });

    expect(result.layer1).toEqual(LAYER1_SYNONYMS);
    expect(result.layer2).toBeUndefined();
    expect(result.voiceAnchored).toBe(false);
    expect(mockLLMProvider.suggestAlternatives).not.toHaveBeenCalled();
    expect(mockContextBuilder.buildRewriteContext).not.toHaveBeenCalled();
  });

  it('returns layer1 synonyms without AI call when includeAILayer is false', async () => {
    const result = await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait.',
      includeAILayer: false,
    });

    expect(result.layer2).toBeUndefined();
    expect(mockLLMProvider.suggestAlternatives).not.toHaveBeenCalled();
  });

  it('calls thesaurus.lookup with the provided word', async () => {
    await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'marcher',
      sentence: 'Il marchait lentement.',
    });

    expect(mockThesaurus.lookup).toHaveBeenCalledWith('marcher');
  });

  // ── Layer 1 + 2 ───────────────────────────────────────────────────────────

  it('returns both layers when includeAILayer is true', async () => {
    const result = await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait.',
      includeAILayer: true,
    });

    expect(result.layer1).toEqual(LAYER1_SYNONYMS);
    expect(result.layer2).toEqual(LAYER2_ALTERNATIVES);
    expect(result.voiceAnchored).toBe(true);
  });

  it('calls buildRewriteContext with ownerId and projectId for layer 2', async () => {
    await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait.',
      includeAILayer: true,
    });

    expect(mockContextBuilder.buildRewriteContext).toHaveBeenCalledWith('u1', 'p1');
  });

  it('passes authorProfile to llmProvider when ADN Stylistique is present', async () => {
    const profile = 'Registre épuré, phrases courtes.';
    vi.mocked(mockContextBuilder.buildRewriteContext).mockResolvedValue(profile);

    await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait.',
      includeAILayer: true,
    });

    expect(mockLLMProvider.suggestAlternatives).toHaveBeenCalledWith(
      'regarder',
      'Elle le regardait.',
      profile
    );
  });

  // ── voiceAnchored logic ────────────────────────────────────────────────────

  it('sets voiceAnchored false when no ADN Stylistique (empty authorProfile)', async () => {
    vi.mocked(mockContextBuilder.buildRewriteContext).mockResolvedValue('');

    const result = await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait.',
      includeAILayer: true,
    });

    expect(result.voiceAnchored).toBe(false);
  });

  it('passes undefined (not empty string) to llmProvider when no ADN Stylistique', async () => {
    vi.mocked(mockContextBuilder.buildRewriteContext).mockResolvedValue('');

    await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'regarder',
      sentence: 'Elle le regardait.',
      includeAILayer: true,
    });

    expect(mockLLMProvider.suggestAlternatives).toHaveBeenCalledWith(
      'regarder',
      'Elle le regardait.',
      undefined
    );
  });

  // ── Edge case : word absent from JDM ──────────────────────────────────────

  it('returns empty layer1 but still calls layer 2 when word is absent from JDM', async () => {
    vi.mocked(mockThesaurus.lookup).mockResolvedValue([]);

    const result = await useCase.execute({
      ownerId: 'u1',
      projectId: 'p1',
      word: 'blémir',
      sentence: 'Son visage blémit.',
      includeAILayer: true,
    });

    expect(result.layer1).toEqual([]);
    expect(mockLLMProvider.suggestAlternatives).toHaveBeenCalled();
    expect(result.layer2).toEqual(LAYER2_ALTERNATIVES);
  });
});
