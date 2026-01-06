// ABOUTME: Use case for importing DOCX files as multi-chapter projects
// ABOUTME: Orchestrates parsing and project creation with chapter auto-naming

import { Project } from '@/domain/entities/Project';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';

export class ImportProjectUseCase {
  constructor(private parser: DocumentParser) {}

  async execute(buffer: Buffer, filename: string): Promise<Project> {
    if (!this.parser.supports(filename)) {
      throw new Error(`Unsupported document format: ${filename}`);
    }

    const chapters = await this.parser.parseToChapters(buffer, filename);

    // Auto-name chapters without titles
    chapters.forEach((chapter, index) => {
      if (!chapter.getTitle() || chapter.getTitle().trim() === '') {
        chapter.updateTitle(`Chapitre ${index + 1}`);
      }
    });

    return new Project(chapters);
  }
}
