// ABOUTME: Factory building the analysis strategy for each category the author selected.
// ABOUTME: Single place where a category is bound to a strategy, so none can be offered without one.

import { AnalysisCategory } from '../../domain/value-objects/AnalysisCategory';
import { AnalysisStrategy } from './AnalysisStrategy';
import { RepetitionAnalysisStrategy, RepetitionLLMClient } from './RepetitionAnalysisStrategy';
import { StyleAnalysisStrategy, StyleLLMClient } from './StyleAnalysisStrategy';

export type AnalysisLLMPort = StyleLLMClient & RepetitionLLMClient;

const STRATEGY_BUILDERS: Record<
  AnalysisCategory,
  (client: AnalysisLLMPort) => AnalysisStrategy
> = {
  repetition: (client) => new RepetitionAnalysisStrategy(client),
  style: (client) => new StyleAnalysisStrategy(client),
};

/**
 * Builds the strategies for the requested categories.
 *
 * Throws on a category with no strategy behind it: the author must never be
 * offered an analysis the application cannot run.
 */
export function createAnalysisStrategies(
  client: AnalysisLLMPort,
  categories: readonly AnalysisCategory[]
): Map<AnalysisCategory, AnalysisStrategy> {
  const strategies = new Map<AnalysisCategory, AnalysisStrategy>();

  for (const category of categories) {
    const build = STRATEGY_BUILDERS[category];
    if (!build) {
      throw new Error(`No analysis strategy is wired for the category "${category}"`);
    }
    strategies.set(category, build(client));
  }

  return strategies;
}
