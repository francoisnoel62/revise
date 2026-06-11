// ABOUTME: Pure cost computation for AI usage in euros.
// ABOUTME: Accepts a pricing entry from the repository rather than a hardcoded table.

import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

export interface CostInput {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
}

/**
 * Compute the euro cost of an AI call from its token usage and a pricing entry.
 * Returns null when entry is null (unknown model) or when no usage was reported.
 * Rates in the entry are USD/M tokens; eurUsdRate converts to EUR.
 */
export function computeCostEur(
  input: CostInput,
  entry: ModelPricingEntry | null,
  eurUsdRate: number
): number | null {
  if (input.inputTokens === null && input.outputTokens === null) {
    return null;
  }
  if (!entry) {
    return null;
  }

  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const cachedTokens = input.cachedInputTokens ?? 0;

  const fullPriceInput = entry.cachedInInput
    ? Math.max(inputTokens - cachedTokens, 0)
    : inputTokens;

  const costUsd =
    (fullPriceInput * entry.inputPerM) / 1_000_000 +
    (cachedTokens * entry.cachedInputPerM) / 1_000_000 +
    (outputTokens * entry.outputPerM) / 1_000_000;

  return costUsd / eurUsdRate;
}
