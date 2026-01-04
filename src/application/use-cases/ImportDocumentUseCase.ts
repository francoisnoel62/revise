// ABOUTME: Application use case for importing documents into TextDocument entities
// ABOUTME: Orchestrates DocumentParser to extract text and create domain entities

import { TextDocument } from '@/domain/entities/TextDocument';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';

export class ImportDocumentUseCase {
  constructor(private readonly parser: DocumentParser) {}

  async execute(buffer: Buffer, filename: string): Promise<TextDocument> {
    if (!this.parser.supports(filename)) {
      throw new Error(`Unsupported document format: ${filename}`);
    }

    const content = await this.parser.parse(buffer, filename);
    const trimmedContent = content.trim();

    return new TextDocument(trimmedContent);
  }
}
