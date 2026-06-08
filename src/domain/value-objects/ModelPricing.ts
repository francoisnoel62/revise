// ABOUTME: Model pricing table and cost computation for AI usage (euros)
// ABOUTME: Rates are a maintained snapshot in €/million tokens; cost is stored per record at usage time

export interface CostInput {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
}

interface PricingEntry {
  /** Matched against the model id via startsWith; most specific prefix listed first. */
  prefix: string;
  /** €/million full-price input tokens. */
  inputPerM: number;
  /** €/million output tokens. */
  outputPerM: number;
  /** €/million cached input tokens (typically ~0.1x of inputPerM). */
  cachedInputPerM: number;
  /**
   * Whether the cached token count is already included in inputTokens.
   * Anthropic reports cache reads separately (false); OpenAI/Google include them
   * inside prompt tokens (true), so cached tokens are discounted, not added.
   */
  cachedInInput: boolean;
}

/**
 * Maintained pricing snapshot in €/million tokens. Anthropic rates follow the
 * published list prices; OpenAI/Google rows are seed values to be kept in sync
 * with each provider's pricing page. Unknown models yield a null cost rather
 * than a fabricated one.
 */
const PRICING: Record<string, PricingEntry[]> = {
  Anthropic: [
    { prefix: 'claude-opus-4', inputPerM: 5, outputPerM: 25, cachedInputPerM: 0.5, cachedInInput: false },
    { prefix: 'claude-sonnet-4', inputPerM: 3, outputPerM: 15, cachedInputPerM: 0.3, cachedInInput: false },
    { prefix: 'claude-haiku-4', inputPerM: 1, outputPerM: 5, cachedInputPerM: 0.1, cachedInInput: false },
  ],
  OpenAI: [
    { prefix: 'gpt-4o-mini', inputPerM: 0.15, outputPerM: 0.6, cachedInputPerM: 0.075, cachedInInput: true },
    { prefix: 'gpt-4o', inputPerM: 2.5, outputPerM: 10, cachedInputPerM: 1.25, cachedInInput: true },
    { prefix: 'gpt-5', inputPerM: 1.25, outputPerM: 10, cachedInputPerM: 0.125, cachedInInput: true },
  ],
  'Google AI': [
    { prefix: 'gemini-3', inputPerM: 2, outputPerM: 12, cachedInputPerM: 0.2, cachedInInput: true },
    { prefix: 'gemini', inputPerM: 0.3, outputPerM: 2.5, cachedInputPerM: 0.075, cachedInInput: true },
  ],
};

/**
 * Compute the euro cost of an AI call from its token usage, using the maintained
 * pricing table. Returns null when the model is not priced or no usage was reported,
 * so the caller can store a null cost rather than a misleading zero.
 */
export function computeCostEur(input: CostInput): number | null {
  if (input.inputTokens === null && input.outputTokens === null) {
    return null;
  }

  const entries = PRICING[input.provider];
  if (!entries) {
    return null;
  }

  const entry = entries.find((e) => input.model.startsWith(e.prefix));
  if (!entry) {
    return null;
  }

  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const cachedTokens = input.cachedInputTokens ?? 0;

  const fullPriceInput = entry.cachedInInput
    ? Math.max(inputTokens - cachedTokens, 0)
    : inputTokens;

  return (
    (fullPriceInput * entry.inputPerM) / 1_000_000 +
    (cachedTokens * entry.cachedInputPerM) / 1_000_000 +
    (outputTokens * entry.outputPerM) / 1_000_000
  );
}
