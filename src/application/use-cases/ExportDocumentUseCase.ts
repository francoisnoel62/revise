// ABOUTME: Application use case for exporting TextDocument entities to file formats
// ABOUTME: Orchestrates DocumentExporter to convert text content into document buffers

import { TextDocument } from '@/domain/entities/TextDocument';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';

export class ExportDocumentUseCase {
  constructor(private readonly exporter: DocumentExporter) {}

  async execute(document: TextDocument, filename: string): Promise<Buffer> {
    if (!this.exporter.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    const content = document.getContent();
    const buffer = await this.exporter.export(content, filename);

    return buffer;
  }
}
