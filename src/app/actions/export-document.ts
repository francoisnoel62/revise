// ABOUTME: Server Action for exporting editor content as .docx file
// ABOUTME: Orchestrates ExportDocumentUseCase with infrastructure dependencies

'use server';

import { ExportDocumentUseCase } from '@/application';
import { DocxExporter } from '@/infrastructure';
import { TextDocument } from '@/domain';

export async function exportDocument(
  content: string,
  filename: string = 'document.docx'
): Promise<{ buffer: number[] } | { error: string }> {
  try {
    const document = new TextDocument(content);
    const exporter = new DocxExporter();
    const useCase = new ExportDocumentUseCase(exporter);

    const buffer = await useCase.execute(document, filename);

    // Convert Buffer to number array for serialization
    return { buffer: Array.from(buffer) };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to export document' };
  }
}
