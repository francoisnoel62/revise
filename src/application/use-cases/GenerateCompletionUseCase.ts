// ABOUTME: Use case for generating AI-powered text completion
// ABOUTME: Loads project metadata via MetadataContextBuilder for context-aware autocompletion

import { LLMProvider } from '../../domain';
import { AIContextBuilder } from '../services/AIContextBuilder';

export interface GenerateCompletionInput {
  ownerId: string;
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
  chapterId?: string;
}

export interface GenerateCompletionResult {
  completion: string;
}

export class GenerateCompletionUseCase {
  constructor(
    private readonly aiContextBuilder: AIContextBuilder,
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

    // 2. Build project context block (optional - don't fail if unavailable)
    const projectContext = await this.aiContextBuilder.buildCompletionContext(
      input.ownerId,
      input.projectId,
      input.chapterId
    );

    // 3. Generate completion using LLM
    const completion = await this.llmProvider.generateCompletion(
      input.textBeforeCursor,
      input.textAfterCursor,
      projectContext
    );

    return {
      completion,
    };
  }
}
