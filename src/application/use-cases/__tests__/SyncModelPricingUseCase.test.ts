// ABOUTME: Tests for SyncModelPricingUseCase
// ABOUTME: Covers diff detection, upsert, report generation, and email sending

import { describe, it, expect, vi } from 'vitest';
import { SyncModelPricingUseCase } from '../SyncModelPricingUseCase';
import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

const existingEntry: ModelPricingEntry = {
  id: '1',
  provider: 'anthropic',
  prefix: 'claude-opus-4',
  inputPerM: 5.0,
  outputPerM: 25.0,
  cachedInputPerM: 0.5,
  cachedInInput: false,
  updatedAt: new Date('2026-01-01'),
};

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    pricingClient: {
      fetchPricingEntries: vi.fn().mockResolvedValue([
        { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 6.0, outputPerM: 25.0, cachedInputPerM: 0.5, cachedInInput: false, updatedAt: new Date() },
        { provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.5, outputPerM: 10.0, cachedInputPerM: 1.25, cachedInInput: true, updatedAt: new Date() },
      ]),
    },
    pricingRepository: {
      findAll: vi.fn().mockResolvedValue([existingEntry]),
      upsertMany: vi.fn().mockResolvedValue(undefined),
    },
    emailService: {
      sendPricingSyncReport: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

describe('SyncModelPricingUseCase', () => {
  it('upserts all fetched entries', async () => {
    const deps = makeDeps();
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    await useCase.execute();

    expect(deps.pricingRepository.upsertMany).toHaveBeenCalledOnce();
    const upserted = deps.pricingRepository.upsertMany.mock.calls[0][0];
    expect(upserted).toHaveLength(2);
  });

  it('identifies new models vs updated models in the diff', async () => {
    const deps = makeDeps();
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    const report = await useCase.execute();

    // gpt-4o is new, claude-opus-4 is updated (price changed)
    const newModel = report.newModels.find((m) => m.key === 'openai/gpt-4o');
    expect(newModel).toBeDefined();
    expect(newModel?.previous).toBeNull();
    expect(newModel?.current.inputPerM).toBe(2.5);

    const updated = report.updatedModels.find((m) => m.key === 'anthropic/claude-opus-4');
    expect(updated).toBeDefined();
    // carries the old and new input price so the email can show the delta
    expect(updated?.previous?.inputPerM).toBe(5.0);
    expect(updated?.current.inputPerM).toBe(6.0);
  });

  it('sends email report after sync', async () => {
    const deps = makeDeps();
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    await useCase.execute();

    expect(deps.emailService.sendPricingSyncReport).toHaveBeenCalledOnce();
  });

  it('captures fetch errors in report and still sends email', async () => {
    const deps = makeDeps({
      pricingClient: { fetchPricingEntries: vi.fn().mockRejectedValue(new Error('network error')) },
    });
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    const report = await useCase.execute();

    expect(report.errors).toHaveLength(1);
    expect(deps.emailService.sendPricingSyncReport).toHaveBeenCalledOnce();
  });

  it('quarantines colliding keys and excludes them from upsert', async () => {
    const deps = makeDeps({
      pricingRepository: {
        findAll: vi.fn().mockResolvedValue([]),
        upsertMany: vi.fn().mockResolvedValue(undefined),
      },
      pricingClient: {
        fetchPricingEntries: vi.fn().mockResolvedValue([
          { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 15.0, outputPerM: 75.0, cachedInputPerM: 1.5, cachedInInput: false, updatedAt: new Date() },
          { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 5.0, outputPerM: 25.0, cachedInputPerM: 0.5, cachedInInput: false, updatedAt: new Date() },
          { provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.5, outputPerM: 10.0, cachedInputPerM: 1.25, cachedInInput: true, updatedAt: new Date() },
        ]),
      },
    });
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    const report = await useCase.execute();

    const upserted = deps.pricingRepository.upsertMany.mock.calls[0][0];
    expect(upserted).toHaveLength(1);
    expect(upserted[0].prefix).toBe('gpt-4o');
    expect(report.newModels.some((m) => m.key === 'anthropic/claude-opus-4')).toBe(false);
    expect(
      report.errors.some((e) => e.includes('Collision') && e.includes('anthropic/claude-opus-4'))
    ).toBe(true);
  });

  it('quarantines changes that exceed the variation threshold', async () => {
    const deps = makeDeps({
      pricingRepository: {
        findAll: vi.fn().mockResolvedValue([
          { id: '1', provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 15.0, outputPerM: 75.0, cachedInputPerM: 1.5, cachedInInput: false, updatedAt: new Date('2026-01-01') },
          { id: '2', provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.5, outputPerM: 10.0, cachedInputPerM: 1.25, cachedInInput: true, updatedAt: new Date('2026-01-01') },
        ]),
        upsertMany: vi.fn().mockResolvedValue(undefined),
      },
      pricingClient: {
        fetchPricingEntries: vi.fn().mockResolvedValue([
          { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 5.0, outputPerM: 25.0, cachedInputPerM: 0.5, cachedInInput: false, updatedAt: new Date() },
          { provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.6, outputPerM: 10.0, cachedInputPerM: 1.25, cachedInInput: true, updatedAt: new Date() },
        ]),
      },
    });
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    const report = await useCase.execute();

    // opus -66.7% is quarantined; gpt-4o +4% is applied
    expect(report.updatedModels.some((m) => m.key === 'anthropic/claude-opus-4')).toBe(false);
    expect(report.updatedModels.some((m) => m.key === 'openai/gpt-4o')).toBe(true);
    const upserted = deps.pricingRepository.upsertMany.mock.calls[0][0];
    expect(upserted.map((e: { prefix: string }) => e.prefix)).toEqual(['gpt-4o']);
    expect(
      report.errors.some((e) => e.includes('Variation') && e.includes('anthropic/claude-opus-4'))
    ).toBe(true);
    // the quarantined swing is also exposed in structured form for the review link
    expect(report.pendingVariations).toEqual([
      {
        key: 'anthropic/claude-opus-4',
        provider: 'anthropic',
        prefix: 'claude-opus-4',
        previous: { inputPerM: 15, outputPerM: 75, cachedInputPerM: 1.5 },
        current: { inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5 },
      },
    ]);
  });

  it('reports totalModels as the count of distinct keys, not raw fetched length', async () => {
    const deps = makeDeps({
      pricingRepository: {
        findAll: vi.fn().mockResolvedValue([]),
        upsertMany: vi.fn().mockResolvedValue(undefined),
      },
      pricingClient: {
        fetchPricingEntries: vi.fn().mockResolvedValue([
          { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 15.0, outputPerM: 75.0, cachedInputPerM: 1.5, cachedInInput: false, updatedAt: new Date() },
          { provider: 'anthropic', prefix: 'claude-opus-4', inputPerM: 5.0, outputPerM: 25.0, cachedInputPerM: 0.5, cachedInInput: false, updatedAt: new Date() },
          { provider: 'openai', prefix: 'gpt-4o', inputPerM: 2.5, outputPerM: 10.0, cachedInputPerM: 1.25, cachedInInput: true, updatedAt: new Date() },
        ]),
      },
    });
    const useCase = new SyncModelPricingUseCase(deps.pricingClient as never, deps.pricingRepository as never, deps.emailService as never);

    const report = await useCase.execute();

    expect(report.totalModels).toBe(2);
  });
});
