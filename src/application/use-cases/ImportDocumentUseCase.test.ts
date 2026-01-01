// ABOUTME: Test suite for ImportDocumentUseCase validating document import orchestration
// ABOUTME: Tests use case coordination between DocumentParser and TextDocument creation

import { describe, it, expect, beforeEach } from 'vitest';
import { ImportDocumentUseCase } from './ImportDocumentUseCase';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { TextDocument } from '@/domain/entities/TextDocument';

// Test double for DocumentParser
class MockDocumentParser implements DocumentParser {
  private mockContent = '';

  setMockContent(content: string): void {
    this.mockContent = content;
  }

  async parse(buffer: Buffer, filename: string): Promise<string> {
    return this.mockContent;
  }

  supports(filename: string): boolean {
    return filename.endsWith('.docx');
  }
}

describe('ImportDocumentUseCase', () => {
  let mockParser: MockDocumentParser;
  let useCase: ImportDocumentUseCase;

  beforeEach(() => {
    mockParser = new MockDocumentParser();
    useCase = new ImportDocumentUseCase(mockParser);
  });

  it('should import document and create TextDocument', async () => {
    const buffer = Buffer.from('fake docx content');
    const filename = 'test.docx';
    mockParser.setMockContent('This is the extracted text from docx.');

    const result = await useCase.execute(buffer, filename);

    expect(result).toBeInstanceOf(TextDocument);
    expect(result.getContent()).toBe('This is the extracted text from docx.');
  });

  it('should handle empty document content', async () => {
    const buffer = Buffer.from('empty docx');
    const filename = 'empty.docx';
    mockParser.setMockContent('');

    const result = await useCase.execute(buffer, filename);

    expect(result.isEmpty()).toBe(true);
  });

  it('should throw error for unsupported format', async () => {
    const buffer = Buffer.from('content');
    const filename = 'test.pdf'; // Unsupported in mock

    await expect(async () => {
      await useCase.execute(buffer, filename);
    }).rejects.toThrow('Unsupported document format: test.pdf');
  });

  it('should propagate parser errors', async () => {
    const failingParser: DocumentParser = {
      async parse() {
        throw new Error('Corrupted file');
      },
      supports() {
        return true;
      },
    };
    const failingUseCase = new ImportDocumentUseCase(failingParser);

    await expect(async () => {
      await failingUseCase.execute(Buffer.from('data'), 'file.docx');
    }).rejects.toThrow('Corrupted file');
  });

  it('should trim whitespace from imported content', async () => {
    const buffer = Buffer.from('content');
    const filename = 'test.docx';
    mockParser.setMockContent('  \n  Content with whitespace  \n  ');

    const result = await useCase.execute(buffer, filename);

    expect(result.getContent()).toBe('Content with whitespace');
  });
});
