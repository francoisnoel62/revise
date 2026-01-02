// ABOUTME: Concrete implementation of DocumentParser for .docx files using mammoth library
// ABOUTME: Extracts plain text from Word documents, stripping formatting

import mammoth from 'mammoth';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';

export class DocxParser implements DocumentParser {
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.docx');
  }

  async parse(buffer: Buffer, filename: string): Promise<string> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse docx: ${error.message}`);
      }
      throw new Error('Failed to parse docx file');
    }
  }
}
