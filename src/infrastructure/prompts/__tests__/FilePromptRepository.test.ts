// ABOUTME: Unit tests for FilePromptRepository
// ABOUTME: Tests file-based prompt loading, error handling, and custom directory support

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilePromptRepository } from '../FilePromptRepository';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';

describe('FilePromptRepository', () => {
  const testPromptsDir = join(process.cwd(), 'test-prompts-temp');
  const metadataDir = join(testPromptsDir, 'metadata');

  beforeEach(async () => {
    // Create test directory structure
    if (!existsSync(testPromptsDir)) {
      await mkdir(testPromptsDir, { recursive: true });
    }
    if (!existsSync(metadataDir)) {
      await mkdir(metadataDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testPromptsDir)) {
      await rm(testPromptsDir, { recursive: true, force: true });
    }
  });

  describe('getNarrativeAnalysisPrompt', () => {
    it('should read narrative analysis prompt from default directory', async () => {
      const repository = new FilePromptRepository();

      const prompt = await repository.getNarrativeAnalysisPrompt();

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should read narrative analysis prompt from custom directory', async () => {
      const testPromptContent = `# Test Narrative Analysis Prompt

This is a test prompt for narrative analysis.

## Instructions
Analyze the following text...`;

      await writeFile(join(metadataDir, 'narrative-analysis.md'), testPromptContent);

      const repository = new FilePromptRepository(testPromptsDir);
      const prompt = await repository.getNarrativeAnalysisPrompt();

      expect(prompt).toBe(testPromptContent.trim());
    });

    it('should trim whitespace from prompt content', async () => {
      const testPromptContent = `  \n\n# Test Prompt\n\nContent here.  \n\n  `;
      await writeFile(join(metadataDir, 'narrative-analysis.md'), testPromptContent);

      const repository = new FilePromptRepository(testPromptsDir);
      const prompt = await repository.getNarrativeAnalysisPrompt();

      expect(prompt).toBe('# Test Prompt\n\nContent here.');
      expect(prompt).not.toMatch(/^\s/);
      expect(prompt).not.toMatch(/\s$/);
    });

    it('should throw error when prompt file does not exist', async () => {
      const repository = new FilePromptRepository(testPromptsDir);

      await expect(repository.getNarrativeAnalysisPrompt()).rejects.toThrow(
        /Failed to read narrative analysis prompt/
      );
    });

    it('should throw error with detailed message on file read failure', async () => {
      const invalidDir = join(process.cwd(), 'non-existent-directory-12345');
      const repository = new FilePromptRepository(invalidDir);

      await expect(repository.getNarrativeAnalysisPrompt()).rejects.toThrow(
        /Failed to read narrative analysis prompt from.*ENOENT/
      );
    });
  });
});
