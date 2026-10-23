// ABOUTME: Tests for the pricing sync report email renderer.
// ABOUTME: Asserts the summary header, per-provider grouping and old -> new price details.

import { describe, it, expect } from 'vitest';
import { renderPricingSyncReportEmail } from '../pricingSyncReportEmail';
import { PricingSyncReport } from '@/domain/interfaces/EmailService';

function makeReport(overrides: Partial<PricingSyncReport> = {}): PricingSyncReport {
  return {
    newModels: [],
    updatedModels: [],
    pendingVariations: [],
    totalModels: 0,
    syncedAt: new Date('2026-06-17T06:00:00Z'),
    errors: [],
    ...overrides,
  };
}

const pendingOpus = {
  key: 'anthropic/claude-opus-4',
  provider: 'anthropic' as const,
  prefix: 'claude-opus-4',
  previous: { inputPerM: 15, outputPerM: 75, cachedInputPerM: 1.5 },
  current: { inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5 },
};

describe('renderPricingSyncReportEmail', () => {
  it('summarizes counts in the subject', () => {
    const report = makeReport({
      newModels: [
        { key: 'openai/gpt-5', provider: 'openai', prefix: 'gpt-5', previous: null, current: { inputPerM: 2, outputPerM: 8, cachedInputPerM: 0.2 } },
      ],
      updatedModels: [
        { key: 'anthropic/claude-opus-4', provider: 'anthropic', prefix: 'claude-opus-4', previous: { inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5 }, current: { inputPerM: 6, outputPerM: 25, cachedInputPerM: 0.6 } },
      ],
      totalModels: 24,
    });

    const { subject } = renderPricingSyncReportEmail(report);

    expect(subject).toContain('1 nouveau');
    expect(subject).toContain('1 modifié');
  });

  it('renders a synthetic header with the key figures', () => {
    const report = makeReport({
      newModels: [
        { key: 'openai/gpt-5', provider: 'openai', prefix: 'gpt-5', previous: null, current: { inputPerM: 2, outputPerM: 8, cachedInputPerM: 0.2 } },
      ],
      totalModels: 24,
    });

    const { html } = renderPricingSyncReportEmail(report);

    // total models in base + new count surfaced in the summary
    expect(html).toContain('24');
    expect(html).toContain('Nouveaux');
  });

  it('groups models by provider with readable provider names', () => {
    const report = makeReport({
      newModels: [
        { key: 'openai/gpt-5', provider: 'openai', prefix: 'gpt-5', previous: null, current: { inputPerM: 2, outputPerM: 8, cachedInputPerM: 0.2 } },
      ],
      updatedModels: [
        { key: 'anthropic/claude-opus-4', provider: 'anthropic', prefix: 'claude-opus-4', previous: { inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5 }, current: { inputPerM: 6, outputPerM: 25, cachedInputPerM: 0.6 } },
      ],
      totalModels: 24,
    });

    const { html } = renderPricingSyncReportEmail(report);

    expect(html).toContain('Anthropic');
    expect(html).toContain('OpenAI');
    expect(html).toContain('claude-opus-4');
    expect(html).toContain('gpt-5');
  });

  it('shows old -> new prices and the variation for updated models', () => {
    const report = makeReport({
      updatedModels: [
        { key: 'anthropic/claude-opus-4', provider: 'anthropic', prefix: 'claude-opus-4', previous: { inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5 }, current: { inputPerM: 6, outputPerM: 25, cachedInputPerM: 0.6 } },
      ],
      totalModels: 24,
    });

    const { html, text } = renderPricingSyncReportEmail(report);

    // old and new input price both present (5 -> 6 = +20%)
    expect(html).toMatch(/5[.,]00/);
    expect(html).toMatch(/6[.,]00/);
    expect(html).toContain('20'); // +20% variation
    // text version also carries the delta
    expect(text).toMatch(/5[.,]00/);
    expect(text).toMatch(/6[.,]00/);
  });

  it('lists the prices of new models', () => {
    const report = makeReport({
      newModels: [
        { key: 'openai/gpt-5', provider: 'openai', prefix: 'gpt-5', previous: null, current: { inputPerM: 2, outputPerM: 8, cachedInputPerM: 0.2 } },
      ],
      totalModels: 24,
    });

    const { html } = renderPricingSyncReportEmail(report);

    expect(html).toMatch(/2[.,]00/);
    expect(html).toMatch(/8[.,]00/);
  });

  it('states clearly when nothing changed', () => {
    const report = makeReport({ totalModels: 24 });

    const { html, text } = renderPricingSyncReportEmail(report);

    expect(html).toContain('Aucun changement');
    expect(text).toContain('Aucun changement');
  });

  it('adds a review button linking to the admin page when variations await validation', () => {
    const report = makeReport({ pendingVariations: [pendingOpus], totalModels: 24 });

    const { subject, html, text } = renderPricingSyncReportEmail(report, 'https://revise.test/admin/pricing');

    expect(html).toContain('<a href="https://revise.test/admin/pricing"');
    expect(html).toContain('Valider les variations');
    expect(text).toContain('https://revise.test/admin/pricing');
    expect(subject).toContain('1 à valider');
    expect(html).not.toContain('Aucun changement');
  });

  it('omits the review button when no variation is pending', () => {
    const report = makeReport({ totalModels: 24 });

    const { subject, html, text } = renderPricingSyncReportEmail(report, 'https://revise.test/admin/pricing');

    expect(html).not.toContain('Valider les variations');
    expect(text).not.toContain('https://revise.test/admin/pricing');
    expect(subject).not.toContain('à valider');
  });

  it('surfaces errors when the sync failed', () => {
    const report = makeReport({ errors: ['network error'] });

    const { html, text } = renderPricingSyncReportEmail(report);

    expect(html).toContain('network error');
    expect(text).toContain('network error');
  });
});
