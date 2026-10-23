// ABOUTME: Tests for ReviewPricingVariationsUseCase
// ABOUTME: Covers listing quarantined price swings and applying them on admin validation

import { describe, it, expect, vi } from 'vitest';
import { ReviewPricingVariationsUseCase } from '../ReviewPricingVariationsUseCase';
import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

function stored(overrides: Partial<ModelPricingEntry>): ModelPricingEntry {
  return {
    id: '1',
    provider: 'anthropic',
    prefix: 'claude-opus-4',
    inputPerM: 15.0,
    outputPerM: 75.0,
    cachedInputPerM: 1.5,
    cachedInInput: false,
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function fetchedEntry(overrides: Partial<Omit<ModelPricingEntry, 'id'>>): Omit<ModelPricingEntry, 'id'> {
  return {
    provider: 'anthropic',
    prefix: 'claude-opus-4',
    inputPerM: 5.0,
    outputPerM: 25.0,
    cachedInputPerM: 0.5,
    cachedInInput: false,
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(fetched: Omit<ModelPricingEntry, 'id'>[], existing: ModelPricingEntry[]) {
  return {
    pricingClient: { fetchPricingEntries: vi.fn().mockResolvedValue(fetched) },
    pricingRepository: {
      findAll: vi.fn().mockResolvedValue(existing),
      upsertMany: vi.fn().mockResolvedValue(undefined),
    },
  };
}

function build(deps: ReturnType<typeof makeDeps>) {
  return new ReviewPricingVariationsUseCase(deps.pricingClient as never, deps.pricingRepository as never);
}

describe('ReviewPricingVariationsUseCase', () => {
  describe('listPending', () => {
    it('lists only the swings above the threshold, with previous and current prices', async () => {
      const deps = makeDeps(
        [
          fetchedEntry({}),
          fetchedEntry({ provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.6, outputPerM: 10, cachedInputPerM: 1.25 }),
        ],
        [
          stored({}),
          stored({ id: '2', provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.5, outputPerM: 10, cachedInputPerM: 1.25 }),
        ]
      );

      const pending = await build(deps).listPending();

      expect(pending).toEqual([
        {
          key: 'anthropic/claude-opus-4',
          provider: 'anthropic',
          prefix: 'claude-opus-4',
          previous: { inputPerM: 15, outputPerM: 75, cachedInputPerM: 1.5 },
          current: { inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5 },
        },
      ]);
    });

    it('ignores unchanged, new and colliding entries', async () => {
      const deps = makeDeps(
        [
          fetchedEntry({ inputPerM: 15, outputPerM: 75, cachedInputPerM: 1.5 }),
          fetchedEntry({ provider: 'google', prefix: 'gemini-new' }),
          fetchedEntry({ provider: 'openai', prefix: 'gpt-x', inputPerM: 1 }),
          fetchedEntry({ provider: 'openai', prefix: 'gpt-x', inputPerM: 9 }),
        ],
        [stored({}), stored({ id: '3', provider: 'openai', prefix: 'gpt-x', inputPerM: 100 })]
      );

      expect(await build(deps).listPending()).toEqual([]);
    });

    it('propagates a fetch failure instead of returning an empty list', async () => {
      const deps = makeDeps([], []);
      deps.pricingClient.fetchPricingEntries.mockRejectedValue(new Error('openrouter down'));

      await expect(build(deps).listPending()).rejects.toThrow('openrouter down');
    });
  });

  describe('apply', () => {
    const fetched = [
      fetchedEntry({}),
      fetchedEntry({ provider: 'openai', prefix: 'gpt-5', inputPerM: 1, outputPerM: 4, cachedInputPerM: 0.1, cachedInInput: true }),
    ];
    const existing = [
      stored({}),
      stored({ id: '2', provider: 'openai', prefix: 'gpt-5', inputPerM: 10, outputPerM: 40, cachedInputPerM: 1, cachedInInput: true }),
    ];

    it('upserts only the requested pending keys', async () => {
      const deps = makeDeps(fetched, existing);

      const report = await build(deps).apply(['openai/gpt-5']);

      const upserted = deps.pricingRepository.upsertMany.mock.calls[0][0];
      expect(upserted.map((e: { prefix: string }) => e.prefix)).toEqual(['gpt-5']);
      expect(report.appliedKeys).toEqual(['openai/gpt-5']);
    });

    it('applies every pending key when none is specified', async () => {
      const deps = makeDeps(fetched, existing);

      const report = await build(deps).apply();

      expect(report.appliedKeys.sort()).toEqual(['anthropic/claude-opus-4', 'openai/gpt-5']);
      expect(deps.pricingRepository.upsertMany.mock.calls[0][0]).toHaveLength(2);
    });

    it('never applies a key that is not a pending swing', async () => {
      const deps = makeDeps(
        [...fetched, fetchedEntry({ provider: 'google', prefix: 'gemini-pro', inputPerM: 1.1, outputPerM: 4, cachedInputPerM: 0.1 })],
        [...existing, stored({ id: '4', provider: 'google', prefix: 'gemini-pro', inputPerM: 1, outputPerM: 4, cachedInputPerM: 0.1 })]
      );

      const report = await build(deps).apply(['google/gemini-pro']);

      expect(report.appliedKeys).toEqual([]);
      expect(deps.pricingRepository.upsertMany).not.toHaveBeenCalled();
    });
  });
});
