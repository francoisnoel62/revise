// ABOUTME: File-based implementation of PromptRepository.
// ABOUTME: Reads AI prompts from markdown files in docs/prompt/ directory.

import { readFile } from 'fs/promises';
import { join } from 'path';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';

/**
 * Repository implementation that reads prompts from markdown files.
 * Prompts are stored in `docs/prompt/` directory for easy editing
 * without requiring code changes or rebuilds.
 */
export class FilePromptRepository implements PromptRepository {
  private readonly promptsDir: string;

  /**
   * @param promptsDir Path to the prompts directory (defaults to docs/prompt)
   */
  constructor(promptsDir?: string) {
    // Default to docs/prompt/ from project root
    this.promptsDir = promptsDir || join(process.cwd(), 'docs', 'prompt');
  }

  /**
   * Read the narrative analysis prompt from markdown file.
   */
  async getNarrativeAnalysisPrompt(): Promise<string> {
    const filePath = join(this.promptsDir, 'metadata', 'narrative-analysis.md');

    try {
      const content = await readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to read narrative analysis prompt from ${filePath}: ${error.message}`
        );
      }
      throw new Error('Failed to read narrative analysis prompt');
    }
  }
}
