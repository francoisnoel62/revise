// ABOUTME: Test suite for ExportDocumentUseCase validating document export orchestration
// ABOUTME: Tests use case coordination between TextDocument and DocumentExporter

import { describe, it, expect, beforeEach } from 'vitest';
import { ExportDocumentUseCase } from './ExportDocumentUseCase';
import { TextDocument } from '@/domain/entities/TextDocument';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';

// Test double for DocumentExporter
class MockDocumentExporter implements DocumentExporter {
  private mockBuffer: Buffer = Buffer.from('');

  setMockBuffer(buffer: Buffer): void {
    this.mockBuffer = buffer;
  }

  async export(content: string, filename: string): Promise<Buffer> {
    return this.mockBuffer;
  }

  supports(filename: string): boolean {
    return filename.endsWith('.docx');
  }
}

describe('ExportDocumentUseCase', () => {
  let mockExporter: MockDocumentExporter;
  let useCase: ExportDocumentUseCase;

  beforeEach(() => {
    mockExporter = new MockDocumentExporter();
    useCase = new ExportDocumentUseCase(mockExporter);
  });

  it('should export document to buffer', async () => {
    const document = new TextDocument('This is my document content.');
    const filename = 'output.docx';
    const expectedBuffer = Buffer.from('fake docx binary');
    mockExporter.setMockBuffer(expectedBuffer);

    const result = await useCase.execute(document, filename);

    expect(result).toEqual(expectedBuffer);
  });

  it('should pass document content to exporter', async () => {
    const document = new TextDocument('Content to export');
    const filename = 'test.docx';

    let capturedContent = '';
    const customExporter: DocumentExporter = {
      async export(content: string) {
        capturedContent = content;
        return Buffer.from('result');
      },
      supports() {
        return true;
      },
    };
    const customUseCase = new ExportDocumentUseCase(customExporter);

    await customUseCase.execute(document, filename);

    expect(capturedContent).toBe('Content to export');
  });

  it('should throw error for unsupported format', async () => {
    const document = new TextDocument('Content');
    const filename = 'output.pdf'; // Unsupported

    await expect(async () => {
      await useCase.execute(document, filename);
    }).rejects.toThrow('Unsupported export format: output.pdf');
  });

  it('should handle empty document export', async () => {
    const document = new TextDocument('');
    const filename = 'empty.docx';
    mockExporter.setMockBuffer(Buffer.from('empty docx'));

    const result = await useCase.execute(document, filename);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should propagate exporter errors', async () => {
    const failingExporter: DocumentExporter = {
      async export() {
        throw new Error('Export failed');
      },
      supports() {
        return true;
      },
    };
    const failingUseCase = new ExportDocumentUseCase(failingExporter);
    const document = new TextDocument('Content');

    await expect(async () => {
      await failingUseCase.execute(document, 'file.docx');
    }).rejects.toThrow('Export failed');
  });
});
