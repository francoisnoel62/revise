// ABOUTME: Interface for AI providers that expose request introspection data
// ABOUTME: Used by TrackedLLMProvider to capture prompt and parameter details after each call

import { GenerationParameters } from '@/domain/value-objects/GenerationParameters';

export interface LastRequestDetails {
  systemPrompt: string | null;
  userMessage: string | null;
  parameters: GenerationParameters | null;
}

export interface IntrospectableProvider {
  getLastRequestDetails(): LastRequestDetails;
}

/**
 * Type guard to check if a provider supports request introspection.
 */
export function isIntrospectable(provider: unknown): provider is IntrospectableProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'getLastRequestDetails' in provider &&
    typeof (provider as IntrospectableProvider).getLastRequestDetails === 'function'
  );
}
