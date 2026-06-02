// ABOUTME: Use case for generating AI-powered text completion
// ABOUTME: Loads project metadata via MetadataContextBuilder for context-aware autocompletion

import { LLMProvider } from '../../domain';
import { MetadataContextBuilder } from '../services/MetadataContextBuilder';

export interface GenerateCompletionInput {
  ownerId: string;
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
}

export interface GenerateCompletionResult {
  completion: string;
}

export class GenerateCompletionUseCase {
  constructor(
    private readonly metadataContextBuilder: MetadataContextBuilder,
    private readonly llmProvider: LLMProvider
  ) {}

  async execute(input: GenerateCompletionInput): Promise<GenerateCompletionResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.textBeforeCursor || input.textBeforeCursor.trim().length === 0) {
      throw new Error('Text before cursor is required');
    }

    // 2. Load project metadata for context (optional - don't fail if unavailable)
    const metadata = await this.metadataContextBuilder.buildForCompletion(
      input.ownerId,
      input.projectId
    );

    // 3. Generate completion using LLM
    const completion = await this.llmProvider.generateCompletion(
      input.textBeforeCursor,
      input.textAfterCursor,
      metadata
    );

    return {
      completion,
    };
  }
}
