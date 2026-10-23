// ABOUTME: Threshold rule deciding whether a price change is too large to apply automatically.
// ABOUTME: Shared by the daily sync (which quarantines swings) and the admin review (which lists them).

import { ModelPricingEntry } from '@/domain/interfaces/ModelPricingRepository';

/** Price swings beyond this ratio are quarantined for manual review instead of applied automatically. */
export const MAX_VARIATION_RATIO = 0.5;

export type PriceFields = Pick<ModelPricingEntry, 'inputPerM' | 'outputPerM' | 'cachedInputPerM'>;

/** True when any of the three rates moves by more than MAX_VARIATION_RATIO (a drop to/from 0 always counts). */
export function exceedsThreshold(prev: PriceFields, current: PriceFields): boolean {
  const fields: (keyof PriceFields)[] = ['inputPerM', 'outputPerM', 'cachedInputPerM'];
  return fields.some((field) => {
    const before = prev[field];
    const after = current[field];
    if (before === after) return false;
    if (before === 0) return true;
    return Math.abs(after - before) / before > MAX_VARIATION_RATIO;
  });
}
