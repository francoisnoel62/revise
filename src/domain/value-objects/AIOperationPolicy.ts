// ABOUTME: Central policy for the autocomplete operation — low latency, no reasoning, tiny output
// ABOUTME: Consumed by the LLM providers so completion params stay consistent across providers

export interface AIOperationPolicy {
  operation: 'autocomplete';
  reasoning: 'off';
  /** Strict output budget (tokens) for a completion. */
  outputBudgetTokens: number;
  /** Low temperature to favor continuity over invention; tunable via Phase 1 telemetry. */
  temperature: number;
  latencyClass: 'realtime';
}

export const AUTOCOMPLETE_POLICY: AIOperationPolicy = {
  operation: 'autocomplete',
  reasoning: 'off',
  outputBudgetTokens: 256,
  temperature: 0.3,
  latencyClass: 'realtime',
};
