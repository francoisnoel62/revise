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
    expect(report.newModels).toContain('openai/gpt-4o');
    expect(report.updatedModels).toContain('anthropic/claude-opus-4');
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
});
