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
 * Maintained pricing snapshot in €/million tokens. Rates converted from official
 * USD list prices at EUR/USD 1.1537 (June 2026). Most specific prefixes are listed
 * first so startsWith matching picks the right tier. Unknown models yield a null
 * cost rather than a fabricated one.
 */
const PRICING: Record<string, PricingEntry[]> = {
  Anthropic: [
    { prefix: 'claude-opus-4', inputPerM: 4.33, outputPerM: 21.67, cachedInputPerM: 0.43, cachedInInput: false },
    { prefix: 'claude-sonnet-4', inputPerM: 2.60, outputPerM: 13.00, cachedInputPerM: 0.26, cachedInInput: false },
    { prefix: 'claude-haiku-4', inputPerM: 0.87, outputPerM: 4.33, cachedInputPerM: 0.09, cachedInInput: false },
  ],
  OpenAI: [
    { prefix: 'gpt-4o-mini', inputPerM: 0.35, outputPerM: 1.39, cachedInputPerM: 0.17, cachedInInput: true },
    { prefix: 'gpt-4o', inputPerM: 2.17, outputPerM: 8.67, cachedInputPerM: 1.08, cachedInInput: true },
    { prefix: 'gpt-5.5', inputPerM: 4.33, outputPerM: 26.00, cachedInputPerM: 0.43, cachedInInput: true },
    { prefix: 'gpt-5.4', inputPerM: 2.17, outputPerM: 13.00, cachedInputPerM: 0.22, cachedInInput: true },
    { prefix: 'gpt-5', inputPerM: 1.08, outputPerM: 4.33, cachedInputPerM: 0.11, cachedInInput: true },
  ],
  'Google AI': [
    { prefix: 'gemini-3.5', inputPerM: 1.30, outputPerM: 7.80, cachedInputPerM: 0.13, cachedInInput: true },
    { prefix: 'gemini-3', inputPerM: 1.73, outputPerM: 10.40, cachedInputPerM: 0.17, cachedInInput: true },
    { prefix: 'gemini-2.5', inputPerM: 0.26, outputPerM: 2.17, cachedInputPerM: 0.03, cachedInInput: true },
    { prefix: 'gemini', inputPerM: 0.09, outputPerM: 0.35, cachedInputPerM: 0.01, cachedInInput: true },
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
