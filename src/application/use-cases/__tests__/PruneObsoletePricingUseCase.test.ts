// ABOUTME: Tests for PruneObsoletePricingUseCase
// ABOUTME: Covers deleting stale keys, keeping current ones, and never deleting on fetch failure

import { describe, it, expect, vi } from 'vitest';
import { PruneObsoletePricingUseCase } from '../PruneObsoletePricingUseCase';
import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

function existing(id: string, provider: ModelPricingEntry['provider'], prefix: string): ModelPricingEntry {
  return {
    id,
    provider,
    prefix,
    inputPerM: 1,
    outputPerM: 5,
    cachedInputPerM: 0.1,
    cachedInInput: provider !== 'anthropic',
    updatedAt: new Date(),
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    pricingClient: {
      fetchPricingEntries: vi.fn().mockResolvedValue([
        { provider: 'anthropic', prefix: 'claude-opus-4-8', inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5, cachedInInput: false, updatedAt: new Date() },
      ]),
    },
    pricingRepository: {
      findAll: vi.fn().mockResolvedValue([
        existing('1', 'anthropic', 'claude-opus-4-8'), // still current
        existing('2', 'anthropic', 'claude-opus-4'),   // obsolete generic leftover
      ]),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

describe('PruneObsoletePricingUseCase', () => {
  it('deletes entries whose key is absent from the latest fetch and keeps current ones', async () => {
    const deps = makeDeps();
    const useCase = new PruneObsoletePricingUseCase(deps.pricingClient as never, deps.pricingRepository as never);

    const report = await useCase.execute();

    expect(deps.pricingRepository.delete).toHaveBeenCalledTimes(1);
    expect(deps.pricingRepository.delete).toHaveBeenCalledWith('2');
    expect(report.deletedKeys).toEqual(['anthropic/claude-opus-4']);
    expect(report.checked).toBe(2);
    expect(report.errors).toHaveLength(0);
  });

  it('deletes nothing when every stored entry is still present in the fetch', async () => {
    const deps = makeDeps({
      pricingClient: {
        fetchPricingEntries: vi.fn().mockResolvedValue([
          { provider: 'anthropic', prefix: 'claude-opus-4-8', inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5, cachedInInput: false, updatedAt: new Date() },
          { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 15, outputPerM: 75, cachedInputPerM: 1.5, cachedInInput: false, updatedAt: new Date() },
        ]),
      },
    });
    const useCase = new PruneObsoletePricingUseCase(deps.pricingClient as never, deps.pricingRepository as never);

    const report = await useCase.execute();

    expect(deps.pricingRepository.delete).not.toHaveBeenCalled();
    expect(report.deletedKeys).toEqual([]);
  });

  it('never deletes when the fetch fails', async () => {
    const deps = makeDeps({
      pricingClient: { fetchPricingEntries: vi.fn().mockRejectedValue(new Error('network error')) },
    });
    const useCase = new PruneObsoletePricingUseCase(deps.pricingClient as never, deps.pricingRepository as never);

    const report = await useCase.execute();

    expect(deps.pricingRepository.delete).not.toHaveBeenCalled();
    expect(report.deletedKeys).toEqual([]);
    expect(report.errors).toHaveLength(1);
  });
});
