// ABOUTME: Domain interface for fetching model pricing from an external source.
// ABOUTME: Abstracts the concrete HTTP client so use cases depend only on domain.

import type { ModelPricingEntry } from './ModelPricingRepository';

export interface PricingClient {
  fetchPricingEntries(): Promise<Omit<ModelPricingEntry, 'id'>[]>;
}
