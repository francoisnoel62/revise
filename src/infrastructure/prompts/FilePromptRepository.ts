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
    return this.readPromptFile('narrative-analysis.md');
  }

  /**
   * Read the stylistic DNA prompt from markdown file.
   */
  async getStylisticDNAPrompt(): Promise<string> {
    return this.readPromptFile('stylistic-dna.md');
  }

  /**
   * Read the characters prompt from markdown file.
   */
  async getCharactersPrompt(): Promise<string> {
    return this.readPromptFile('characters.md');
  }

  /**
   * Read the plot prompt from markdown file.
   */
  async getPlotPrompt(): Promise<string> {
    return this.readPromptFile('plot.md');
  }

  /**
   * Read the worldbuilding prompt from markdown file.
   */
  async getWorldbuildingPrompt(): Promise<string> {
    return this.readPromptFile('worldbuilding.md');
  }

  /**
   * Read the synthesis prompt from markdown file.
   */
  async getSynthesisPrompt(): Promise<string> {
    return this.readPromptFile('synthesis.md');
  }

  /**
   * Helper method to read a prompt file from the metadata directory.
   */
  private async readPromptFile(filename: string): Promise<string> {
    const filePath = join(this.promptsDir, 'metadata', filename);

    try {
      const content = await readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to read prompt from ${filePath}: ${error.message}`
        );
      }
      throw new Error(`Failed to read prompt: ${filename}`);
    }
  }
}
