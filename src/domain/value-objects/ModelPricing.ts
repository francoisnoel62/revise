// ABOUTME: Pure cost computation for AI usage in euros, plus pricing-entry matching.
// ABOUTME: Accepts a pricing entry from the repository rather than a hardcoded table.

import { ModelPricingEntry, PricingProvider } from '@/domain/interfaces/ModelPricingRepository';

export interface CostInput {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
}

/**
 * Normalize a model id for matching: lowercase and treat "." and "-" as the
 * same separator. OpenRouter ids use dots ("claude-opus-4.8") while runtime
 * model ids use dashes ("claude-opus-4-8"); this bridges the two notations.
 */
function normalizeModelId(id: string): string {
  return id.toLowerCase().replace(/\./g, '-');
}

/**
 * Select the pricing entry for a model. Among entries for the same provider
 * whose prefix is a segment-prefix of the model id (equal, or followed by a
 * "-"), return the most specific (longest) match. A segment boundary keeps
 * "gpt-4" from matching "gpt-4o". Returns null when none match.
 */
export function selectPricingEntry(
  entries: ModelPricingEntry[],
  provider: PricingProvider,
  model: string
): ModelPricingEntry | null {
  const normModel = normalizeModelId(model);
  let best: ModelPricingEntry | null = null;
  let bestLength = -1;

  for (const entry of entries) {
    if (entry.provider !== provider) continue;
    const normPrefix = normalizeModelId(entry.prefix);
    const matches = normModel === normPrefix || normModel.startsWith(`${normPrefix}-`);
    if (matches && normPrefix.length > bestLength) {
      best = entry;
      bestLength = normPrefix.length;
    }
  }

  return best;
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
