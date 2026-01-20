// ABOUTME: Unit test suite for MarkdownFolderParser validating folder import
// ABOUTME: Tests file ordering, title extraction, and chapter creation from multiple .md files

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownFolderParser } from './MarkdownFolderParser';
import { FolderFile } from '@/domain/interfaces/FolderParser';

// Mock the tiptap-conversion module
vi.mock('../utils/tiptap-conversion', () => ({
  htmlToTipTapJSON: vi.fn((html: string) => {
    // Return a mock TipTap JSON that preserves the HTML content for testing
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: html }],
        },
      ],
      _originalHtml: html, // For testing purposes
    };
  }),
}));

describe('MarkdownFolderParser', () => {
  let parser: MarkdownFolderParser;

  beforeEach(() => {
    parser = new MarkdownFolderParser();
  });

  const createFile = (name: string, relativePath: string, content: string): FolderFile => ({
    name,
    relativePath,
    buffer: Buffer.from(content),
  });

  describe('supports', () => {
    it('should return true when folder contains .md files', () => {
      const files: FolderFile[] = [
        createFile('01-intro.md', '01-intro.md', '# Intro'),
        createFile('02-chapter.md', '02-chapter.md', '# Chapter'),
      ];

      expect(parser.supports(files)).toBe(true);
    });

    it('should return false when folder has no .md files', () => {
      const files: FolderFile[] = [
        createFile('readme.txt', 'readme.txt', 'text'),
        createFile('document.docx', 'document.docx', 'docx'),
      ];

      expect(parser.supports(files)).toBe(false);
    });

    it('should return true with mixed files including .md', () => {
      const files: FolderFile[] = [
        createFile('readme.txt', 'readme.txt', 'text'),
        createFile('01-intro.md', '01-intro.md', '# Intro'),
      ];

      expect(parser.supports(files)).toBe(true);
    });

    it('should return false for empty folder', () => {
      expect(parser.supports([])).toBe(false);
    });
  });

  describe('parseToChapters', () => {
    it('should throw error when no .md files found', async () => {
      const files: FolderFile[] = [
        createFile('readme.txt', 'readme.txt', 'text'),
      ];

      await expect(parser.parseToChapters(files)).rejects.toThrow(
        'Aucun fichier .md trouvé dans le dossier'
      );
    });

    it('should create one chapter per .md file', async () => {
      const files: FolderFile[] = [
        createFile('01-intro.md', '01-intro.md', 'Introduction content.'),
        createFile('02-chapter.md', '02-chapter.md', 'Chapter content.'),
        createFile('03-conclusion.md', '03-conclusion.md', 'Conclusion content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters).toHaveLength(3);
    });

    it('should order chapters by numeric prefix', async () => {
      const files: FolderFile[] = [
        createFile('03-conclusion.md', '03-conclusion.md', 'Conclusion.'),
        createFile('01-intro.md', '01-intro.md', 'Intro.'),
        createFile('02-chapter.md', '02-chapter.md', 'Chapter.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Intro');
      expect(chapters[1].getTitle()).toBe('Chapter');
      expect(chapters[2].getTitle()).toBe('Conclusion');
    });

    it('should extract title from filename without prefix', async () => {
      const files: FolderFile[] = [
        createFile('01-introduction.md', '01-introduction.md', 'Content.'),
        createFile('02-le-voyage.md', '02-le-voyage.md', 'Content.'),
        createFile('epilogue.md', 'epilogue.md', 'Content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Introduction');
      expect(chapters[1].getTitle()).toBe('Le voyage');
      expect(chapters[2].getTitle()).toBe('Epilogue');
    });

    it('should handle files without numeric prefix (sorted alphabetically)', async () => {
      const files: FolderFile[] = [
        createFile('zebra.md', 'zebra.md', 'Z content.'),
        createFile('alpha.md', 'alpha.md', 'A content.'),
        createFile('beta.md', 'beta.md', 'B content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Alpha');
      expect(chapters[1].getTitle()).toBe('Beta');
      expect(chapters[2].getTitle()).toBe('Zebra');
    });

    it('should order by directory then by numeric prefix (recursive)', async () => {
      const files: FolderFile[] = [
        createFile('02-chapitre.md', 'partie-2/02-chapitre.md', 'P2C2.'),
        createFile('01-intro.md', 'partie-1/01-intro.md', 'P1C1.'),
        createFile('01-debut.md', 'partie-2/01-debut.md', 'P2C1.'),
        createFile('02-suite.md', 'partie-1/02-suite.md', 'P1C2.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Intro');
      expect(chapters[1].getTitle()).toBe('Suite');
      expect(chapters[2].getTitle()).toBe('Debut');
      expect(chapters[3].getTitle()).toBe('Chapitre');
    });

    it('should set correct chapter order indices', async () => {
      const files: FolderFile[] = [
        createFile('03-end.md', '03-end.md', 'End.'),
        createFile('01-start.md', '01-start.md', 'Start.'),
        createFile('02-middle.md', '02-middle.md', 'Middle.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getOrder()).toBe(0);
      expect(chapters[1].getOrder()).toBe(1);
      expect(chapters[2].getOrder()).toBe(2);
    });

    it('should replace em dash with semicolon in content', async () => {
      const files: FolderFile[] = [
        createFile('01-test.md', '01-test.md', 'He said — and I quote — hello.'),
      ];

      const chapters = await parser.parseToChapters(files);
      const content = JSON.parse(chapters[0].getContent());
      const textContent = JSON.stringify(content);

      expect(textContent).not.toContain('—');
      expect(textContent).toContain(';');
    });

    it('should preserve bold and italic formatting in HTML', async () => {
      const files: FolderFile[] = [
        createFile('01-test.md', '01-test.md', 'This is **bold** and *italic* text.'),
      ];

      const chapters = await parser.parseToChapters(files);
      const content = JSON.parse(chapters[0].getContent());

      // The mock includes the original HTML which should have <strong> and <em> tags
      expect(content._originalHtml).toContain('<strong>');
      expect(content._originalHtml).toContain('<em>');
    });

    it('should filter out non-.md files', async () => {
      const files: FolderFile[] = [
        createFile('01-intro.md', '01-intro.md', 'Intro content.'),
        createFile('readme.txt', 'readme.txt', 'README'),
        createFile('02-chapter.md', '02-chapter.md', 'Chapter content.'),
        createFile('image.png', 'image.png', 'PNG'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].getTitle()).toBe('Intro');
      expect(chapters[1].getTitle()).toBe('Chapter');
    });

    it('should generate valid TipTap JSON content', async () => {
      const files: FolderFile[] = [
        createFile('01-test.md', '01-test.md', 'This is a paragraph.\n\n**Bold** text.'),
      ];

      const chapters = await parser.parseToChapters(files);
      const content = JSON.parse(chapters[0].getContent());

      expect(content).toHaveProperty('type', 'doc');
      expect(content).toHaveProperty('content');
      expect(Array.isArray(content.content)).toBe(true);
    });

    it('should handle deeply nested directories', async () => {
      const files: FolderFile[] = [
        createFile('02-ch2.md', 'book/part-1/section-b/02-ch2.md', 'Ch2.'),
        createFile('01-ch1.md', 'book/part-1/section-a/01-ch1.md', 'Ch1.'),
        createFile('01-ch3.md', 'book/part-2/01-ch3.md', 'Ch3.'),
      ];

      const chapters = await parser.parseToChapters(files);

      // Should be sorted: part-1/section-a, part-1/section-b, part-2
      expect(chapters[0].getTitle()).toBe('Ch1');
      expect(chapters[1].getTitle()).toBe('Ch2');
      expect(chapters[2].getTitle()).toBe('Ch3');
    });

    it('should handle filename with multiple dashes', async () => {
      const files: FolderFile[] = [
        createFile('01-le-grand-voyage.md', '01-le-grand-voyage.md', 'Content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Le grand voyage');
    });

    it('should handle filename with underscores', async () => {
      const files: FolderFile[] = [
        createFile('01_premier_chapitre.md', '01_premier_chapitre.md', 'Content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Premier chapitre');
    });

    it('should capitalize first letter of title', async () => {
      const files: FolderFile[] = [
        createFile('01-hello.md', '01-hello.md', 'Content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Hello');
    });

    it('should use "Sans titre" for empty filename after processing', async () => {
      const files: FolderFile[] = [
        createFile('01-.md', '01-.md', 'Content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters[0].getTitle()).toBe('Sans titre');
    });

    it('should strip YAML frontmatter from each file', async () => {
      const files: FolderFile[] = [
        createFile(
          '01-chapter.md',
          '01-chapter.md',
          `---
title: Chapter One
date: 2024-01-15
---

This is the actual content.`
        ),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters).toHaveLength(1);
      const content = JSON.parse(chapters[0].getContent());
      expect(content._originalHtml).not.toContain('title: Chapter One');
      expect(content._originalHtml).not.toContain('date: 2024-01-15');
      expect(content._originalHtml).toContain('actual content');
    });

    it('should strip YAML frontmatter from multiple files', async () => {
      const files: FolderFile[] = [
        createFile(
          '01-intro.md',
          '01-intro.md',
          `---
title: Introduction
---

Intro content.`
        ),
        createFile(
          '02-chapter.md',
          '02-chapter.md',
          `---
title: Main Chapter
tags: [fiction]
---

Chapter content.`
        ),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters).toHaveLength(2);

      const content1 = JSON.parse(chapters[0].getContent());
      expect(content1._originalHtml).not.toContain('title: Introduction');
      expect(content1._originalHtml).toContain('Intro content');

      const content2 = JSON.parse(chapters[1].getContent());
      expect(content2._originalHtml).not.toContain('title: Main Chapter');
      expect(content2._originalHtml).toContain('Chapter content');
    });

    it('should handle files without YAML frontmatter', async () => {
      const files: FolderFile[] = [
        createFile('01-chapter.md', '01-chapter.md', 'Just regular markdown content.'),
      ];

      const chapters = await parser.parseToChapters(files);

      expect(chapters).toHaveLength(1);
      const content = JSON.parse(chapters[0].getContent());
      expect(content._originalHtml).toContain('regular markdown');
    });

    it('should add font-size 16pt to H1 and 14pt to H2 via spans', async () => {
      const files: FolderFile[] = [
        createFile(
          '01-chapter.md',
          '01-chapter.md',
          `# Main Title

## Subtitle

Some text.`
        ),
      ];

      const chapters = await parser.parseToChapters(files);
      const content = JSON.parse(chapters[0].getContent());

      // Font sizes are applied via spans inside the headings
      expect(content._originalHtml).toContain('<h1><span style="font-size: 16pt">');
      expect(content._originalHtml).toContain('<h2><span style="font-size: 14pt">');
    });

    it('should add font-size 12pt to paragraphs via span', async () => {
      const files: FolderFile[] = [
        createFile('01-chapter.md', '01-chapter.md', 'This is a paragraph.'),
      ];

      const chapters = await parser.parseToChapters(files);
      const content = JSON.parse(chapters[0].getContent());

      // Font size is applied via span inside the paragraph
      expect(content._originalHtml).toContain('<span style="font-size: 12pt">');
    });
  });
});
