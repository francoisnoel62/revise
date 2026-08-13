// ABOUTME: Test suite for ImportProjectUseCase validating multi-chapter project import
// ABOUTME: Tests use case coordination between DocumentParser and Project creation

import { describe, it, expect, beforeEach } from 'vitest';
import { ImportProjectUseCase } from './ImportProjectUseCase';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { Chapter } from '@/domain/entities/Chapter';

// Test double for DocumentParser
class MockDocumentParser implements DocumentParser {
  private mockChapters: Chapter[] = [];

  setMockChapters(chapters: Chapter[]): void {
    this.mockChapters = chapters;
  }

  async parseToChapters(_buffer: Buffer, _filename: string): Promise<Chapter[]> {
    return this.mockChapters;
  }

  async parse(_buffer: Buffer, _filename: string): Promise<string> {
    throw new Error('Not used in Phase 2');
  }

  supports(filename: string): boolean {
    return filename.endsWith('.docx');
  }
}

describe('ImportProjectUseCase', () => {
  let mockParser: MockDocumentParser;
  let useCase: ImportProjectUseCase;
  const testIdGenerator = { generate: () => 'imported-project-id' };

  beforeEach(() => {
    mockParser = new MockDocumentParser();
    useCase = new ImportProjectUseCase(mockParser, undefined, testIdGenerator);
  });

  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  it('should import document and create Project with chapters', async () => {
    const buffer = Buffer.from('fake docx content');
    const filename = 'test.docx';
    const mockChapters = [
      createMockChapter('id-1', 'Chapter 1', 0),
      createMockChapter('id-2', 'Chapter 2', 1),
    ];
    mockParser.setMockChapters(mockChapters);

    const result = await useCase.execute(null, buffer, filename);

    expect(result.getChapterCount()).toBe(2);
    expect(result.getChapter('id-1')?.getTitle()).toBe('Chapter 1');
    expect(result.getChapter('id-2')?.getTitle()).toBe('Chapter 2');
  });

  it('should insert the semantic chapter title into imported chapter content', async () => {
    const importedContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, semanticRole: 'sous-titre' },
          content: [{ type: 'text', text: 'Premiere section' }],
        },
        {
          type: 'paragraph',
          attrs: { semanticRole: 'corps' },
          content: [{ type: 'text', text: 'Le corps du chapitre.' }],
        },
      ],
    });
    mockParser.setMockChapters([
      new Chapter('id-1', 'Chapitre importe', importedContent, 0),
    ]);

    const result = await useCase.execute(null, Buffer.from('content'), 'test.docx');
    const content = JSON.parse(result.getChapter('id-1')!.getContent());

    expect(content.content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
      content: [{ type: 'text', text: 'Chapitre importe' }],
    });
    expect(content.content[1].attrs.semanticRole).toBe('sous-titre');
    expect(content.content[2].attrs.semanticRole).toBe('corps');
  });

  it('should auto-name chapters without titles', async () => {
    const buffer = Buffer.from('content');
    const filename = 'test.docx';
    const mockChapters = [
      createMockChapter('id-1', '', 0),
      createMockChapter('id-2', '   ', 1),
      createMockChapter('id-3', 'Valid Title', 2),
    ];
    mockParser.setMockChapters(mockChapters);

    const result = await useCase.execute(null, buffer, filename);

    expect(result.getChapter('id-1')?.getTitle()).toBe('Chapitre 1');
    expect(result.getChapter('id-2')?.getTitle()).toBe('Chapitre 2');
    expect(result.getChapter('id-3')?.getTitle()).toBe('Valid Title');
  });

  it('should handle empty chapter list', async () => {
    const buffer = Buffer.from('content');
    const filename = 'test.docx';
    mockParser.setMockChapters([]);

    const result = await useCase.execute(null, buffer, filename);

    expect(result.getChapterCount()).toBe(0);
  });

  it('should throw error for unsupported format', async () => {
    const buffer = Buffer.from('content');
    const filename = 'test.pdf';

    await expect(async () => {
      await useCase.execute(null, buffer, filename);
    }).rejects.toThrow('Unsupported document format: test.pdf');
  });

  it('should propagate parser errors', async () => {
    const failingParser: DocumentParser = {
      async parseToChapters() {
        throw new Error('Corrupted file');
      },
      async parse() {
        throw new Error('Not used');
      },
      supports() {
        return true;
      },
    };
    const failingUseCase = new ImportProjectUseCase(failingParser, undefined, testIdGenerator);

    await expect(async () => {
      await failingUseCase.execute(null, Buffer.from('data'), 'file.docx');
    }).rejects.toThrow('Corrupted file');
  });

  it('should handle single chapter import', async () => {
    const buffer = Buffer.from('content');
    const filename = 'test.docx';
    const mockChapters = [createMockChapter('id-1', 'Only Chapter', 0)];
    mockParser.setMockChapters(mockChapters);

    const result = await useCase.execute(null, buffer, filename);

    expect(result.getChapterCount()).toBe(1);
    expect(result.getActiveChapter()?.getTitle()).toBe('Only Chapter');
  });
});
