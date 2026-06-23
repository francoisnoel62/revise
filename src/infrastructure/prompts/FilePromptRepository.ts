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
    return this.readPromptFile('narrative-analysis.md', 'narrative analysis');
  }

  /**
   * Read the stylistic DNA prompt from markdown file.
   */
  async getStylisticDNAPrompt(): Promise<string> {
    return this.readPromptFile('stylistic-dna.md', 'stylistic DNA');
  }

  /**
   * Read the characters prompt from markdown file.
   */
  async getCharactersPrompt(): Promise<string> {
    return this.readPromptFile('characters.md', 'characters');
  }

  /**
   * Read the plot prompt from markdown file.
   */
  async getPlotPrompt(): Promise<string> {
    return this.readPromptFile('plot.md', 'plot');
  }

  /**
   * Read the worldbuilding prompt from markdown file.
   */
  async getWorldbuildingPrompt(): Promise<string> {
    return this.readPromptFile('worldbuilding.md', 'worldbuilding');
  }

  /**
   * Read the synthesis prompt from markdown file.
   */
  async getSynthesisPrompt(): Promise<string> {
    return this.readPromptFile('synthesis.md', 'synthesis');
  }

  /**
   * Read the chapter summaries prompt from markdown file.
   */
  async getChapterSummariesPrompt(): Promise<string> {
    return this.readPromptFile('chapter-summaries.md', 'chapter summaries');
  }

  /**
   * Read the canon-facts extraction prompt from markdown file.
   */
  async getCanonFactsPrompt(): Promise<string> {
    return this.readPromptFile('canon-facts.md', 'canon facts');
  }

  /**
   * Read the chapter beginning generation prompt from markdown file.
   */
  async getChapterBeginningPrompt(): Promise<string> {
    return this.readPromptFile(
      'chapter-beginning.md',
      'chapter beginning',
      'chapter-generation'
    );
  }

  /**
   * Read the full chapter generation prompt from markdown file.
   */
  async getChapterFullPrompt(): Promise<string> {
    return this.readPromptFile('chapter-full.md', 'full chapter', 'chapter-generation');
  }

  /**
   * Read the chapter outline generation prompt from markdown file.
   */
  async getChapterOutlinePrompt(): Promise<string> {
    return this.readPromptFile('chapter-outline.md', 'chapter outline', 'chapter-generation');
  }

  /**
   * Read the character sheet generation prompt from markdown file.
   */
  async getCharacterSheetPrompt(): Promise<string> {
    return this.readPromptFile('character-sheet.md', 'character sheet');
  }

  /**
   * Read the autocompletion prompt from markdown file.
   */
  async getCompletionPrompt(): Promise<string> {
    // Autocompletion prompt is at root level, not in a subdirectory
    const filePath = join(this.promptsDir, 'autocompletion.md');

    try {
      const content = await readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to read autocompletion prompt from ${filePath}: ${error.message}`,
          { cause: error }
        );
      }
      throw new Error('Failed to read autocompletion prompt', { cause: error });
    }
  }

  /**
   * Helper method to read a prompt file from a subdirectory.
   * @param filename The name of the file to read
   * @param promptType Human-readable name for error messages
   * @param subdir Subdirectory (defaults to 'metadata')
   */
  private async readPromptFile(
    filename: string,
    promptType?: string,
    subdir: string = 'metadata'
  ): Promise<string> {
    const filePath = join(this.promptsDir, subdir, filename);

    try {
      const content = await readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      if (error instanceof Error) {
        const typeName = promptType || filename;
        throw new Error(
          `Failed to read ${typeName} prompt from ${filePath}: ${error.message}`,
          { cause: error }
        );
      }
      throw new Error(`Failed to read prompt: ${filename}`, { cause: error });
    }
  }
}
