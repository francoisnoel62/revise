// ABOUTME: Server Action for importing .docx documents into the editor
// ABOUTME: Orchestrates ImportDocumentUseCase with infrastructure dependencies

'use server';

import { ImportDocumentUseCase } from '@/application';
import { DocxParser } from '@/infrastructure';

export async function importDocument(
  formData: FormData
): Promise<{ content: string } | { error: string }> {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return { error: 'No file provided' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new DocxParser();
    const useCase = new ImportDocumentUseCase(parser);

    const document = await useCase.execute(buffer, file.name);

    return { content: document.getContent() };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to import document' };
  }
}
