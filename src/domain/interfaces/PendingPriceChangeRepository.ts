// ABOUTME: Domain interface for model price variations that exceeded the auto-apply threshold.
// ABOUTME: Lets an admin review and approve or reject each quarantined change instead of losing it once the sync email is read.

import { PricingProvider } from './ModelPricingRepository';
import { PriceSnapshot } from './EmailService';

export interface PendingPriceChange {
  id: string;
  /** "provider/prefix" identifier, e.g. "openai/gpt-4o" */
  key: string;
  provider: PricingProvider;
  prefix: string;
  /** Id of the ModelPricingEntry this change would update once approved. */
  modelPricingId: string;
  previous: PriceSnapshot;
  current: PriceSnapshot;
  detectedAt: Date;
}

export interface PendingPriceChangeRepository {
  findAll(): Promise<PendingPriceChange[]>;
  /** Upserts by key: a repeated quarantine for the same model refreshes its previous/current values. */
  upsert(change: Omit<PendingPriceChange, 'id'>): Promise<void>;
  /** Clears a pending change for a key once it's no longer relevant (e.g. resolved by a normal, non-quarantined update). */
  deleteByKey(key: string): Promise<void>;
  delete(id: string): Promise<void>;
}
