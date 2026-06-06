// ABOUTME: Performance benchmarks for Phase 2 operations
// ABOUTME: Validates performance targets for import, export, and chapter switching

import { describe, it, expect, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { DocxParser } from '@/infrastructure/document/parsers/DocxParser';
import { DocxExporter } from '@/infrastructure/document/exporters/DocxExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { useProjectStore } from '@/store/projectStore';
import { serializeProject } from '@/infrastructure/persistence/serialization/project-serializer';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Helper: Create a large project for performance testing
 */
function createLargeProject(): Project {
  const chapters: Chapter[] = [];

  // Create 10 chapters with ~5000 words each
  for (let i = 0; i < 10; i++) {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: generateLoremIpsum(5000),
            },
          ],
        },
      ],
    };

    chapters.push(
      new Chapter(
        `chapter-${i}`,
        `Chapter ${i + 1}`,
        JSON.stringify(content),
        i
      )
    );
  }

  return Project.create('test-user', 'Test Project', chapters);
}

/**
 * Helper: Generate Lorem Ipsum text of specified word count
 */
function generateLoremIpsum(wordCount: number): string {
  const words = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
  ];

  const result: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(words[i % words.length]);
  }

  return result.join(' ');
}

describe('Performance Tests', () => {
  describe('Document Import', () => {
    it('should import typical DOCX in under 3 seconds', async () => {
      // Use sample.docx from fixtures
      const fixturesPath = join(__dirname, '../fixtures/sample.docx');
      let buffer: Buffer;

      try {
        buffer = readFileSync(fixturesPath);
      } catch {
        // Skip test if fixture not found
        console.log('⚠️  Skipping import performance test - fixture not found');
        return;
      }

      const parser = new DocxParser();

      const start = performance.now();
      await parser.parseToChapters(buffer, 'sample.docx');
      const duration = performance.now() - start;

      console.log(`  ✓ Import duration: ${duration.toFixed(0)}ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should import large DOCX (1.2MB) efficiently', async () => {
      // Use large-novel.docx from fixtures (La Prophétie d'Apophis - 1.2MB)
      const fixturesPath = join(__dirname, '../fixtures/large-novel.docx');
      let buffer: Buffer;

      try {
        buffer = readFileSync(fixturesPath);
      } catch {
        console.log('⚠️  Skipping large import test - fixture not found');
        return;
      }

      const parser = new DocxParser();

      const start = performance.now();
      const chapters = await parser.parseToChapters(buffer, 'large-novel.docx');
      const duration = performance.now() - start;

      console.log(
        `  ✓ Large import (${(buffer.length / 1024 / 1024).toFixed(2)}MB, ${chapters.length} chapters): ${duration.toFixed(0)}ms`
      );

      // Large documents may take longer, but should still be reasonable
      expect(duration).toBeLessThan(5000);
      expect(chapters.length).toBeGreaterThan(0);
    });
  });

  describe('Project Export', () => {
    it('should export large project in under 2 seconds', async () => {
      const project = createLargeProject();
      const exporter = new DocxExporter();

      const start = performance.now();
      await exporter.exportProject(project, 'export.docx');
      const duration = performance.now() - start;

      console.log(`  ✓ Export duration: ${duration.toFixed(0)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should export medium project efficiently', async () => {
      // Create 3 chapters with ~1000 words each
      const chapters: Chapter[] = [];
      for (let i = 0; i < 3; i++) {
        const content = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: generateLoremIpsum(1000) }],
            },
          ],
        };

        chapters.push(
          new Chapter(
            `chapter-${i}`,
            `Chapter ${i + 1}`,
            JSON.stringify(content),
            i
          )
        );
      }

      const project = Project.create('test-user', 'Test Project', chapters);
      const exporter = new DocxExporter();

      const start = performance.now();
      await exporter.exportProject(project, 'export.docx');
      const duration = performance.now() - start;

      console.log(`  ✓ Medium export duration: ${duration.toFixed(0)}ms`);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Chapter Switching', () => {
    beforeEach(() => {
      // Reset store before each test
      const project = Project.createEmpty('test-user', 'Test Project');
      useProjectStore.setState({
        project: project as unknown as import('@/app/actions/project-actions').SerializedProject,
        activeContent: JSON.stringify({ type: 'doc', content: [] }),
        hasUnsavedChanges: false,
      });
    });

    it('should switch chapters in under 200ms', async () => {
      const project = createLargeProject();
      useProjectStore.setState({
        project: serializeProject(project) as unknown as import('@/app/actions/project-actions').SerializedProject,
        activeContent: project.getChapters()[0].getContent(),
      });

      const firstChapterId = project.getChapters()[0].getId();
      const secondChapterId = project.getChapters()[1].getId();

      // Switch to first chapter
      await useProjectStore.getState().setActiveChapter(firstChapterId);

      // Measure switch to second chapter
      const start = performance.now();
      await useProjectStore.getState().setActiveChapter(secondChapterId);
      const duration = performance.now() - start;

      console.log(`  ✓ Chapter switch duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('should handle rapid chapter switches', async () => {
      const project = createLargeProject();
      useProjectStore.setState({
        project: serializeProject(project) as unknown as import('@/app/actions/project-actions').SerializedProject,
        activeContent: project.getChapters()[0].getContent(),
      });

      const chapters = project.getChapters();
      const durations: number[] = [];

      // Perform 10 rapid switches
      for (let i = 0; i < 10; i++) {
        const chapterId = chapters[i % chapters.length].getId();

        const start = performance.now();
        await useProjectStore.getState().setActiveChapter(chapterId);
        const duration = performance.now() - start;

        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      console.log(
        `  ✓ Avg switch: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`
      );

      expect(avgDuration).toBeLessThan(200);
      expect(maxDuration).toBeLessThan(300);
    });
  });

  describe('Content Updates', () => {
    beforeEach(() => {
      const project = Project.createEmpty('test-user', 'Test Project');
      useProjectStore.setState({
        project: project as unknown as import('@/app/actions/project-actions').SerializedProject,
        activeContent: JSON.stringify({ type: 'doc', content: [] }),
        hasUnsavedChanges: false,
      });
    });

    it('should update content quickly', () => {
      const project = createLargeProject();
      useProjectStore.setState({
        project: serializeProject(project) as unknown as import('@/app/actions/project-actions').SerializedProject,
        activeContent: project.getChapters()[0].getContent(),
      });

      const newContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Updated content' }],
          },
        ],
      });

      const start = performance.now();
      useProjectStore.getState().updateActiveContent(newContent);
      const duration = performance.now() - start;

      console.log(`  ✓ Content update duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });
  });
});
