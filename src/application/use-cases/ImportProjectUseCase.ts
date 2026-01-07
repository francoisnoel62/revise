// ABOUTME: Use case for importing a DOCX file as a multi-chapter project.
// ABOUTME: Parses document, splits by H1 headings, and creates Project entity.

import { randomUUID } from 'crypto';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { Project } from '@/domain/entities/Project';

export class ImportProjectUseCase {
  constructor(
    private parser: DocumentParser,
    private repository?: ProjectRepository // Optional for backward compatibility
  ) {}

  /**
   * Import a document as a new project.
   * @param userId Owner of the project (required if repository provided)
   * @param buffer File content
   * @param filename Original filename for format detection
   * @returns Created Project (persisted if repository provided)
   */
  async execute(userId: string | null, buffer: Buffer, filename: string): Promise<Project> {
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

    // Create project with ownership if userId provided
    const project = userId
      ? Project.create(userId, this.extractProjectTitle(filename), chapters)
      : new Project(
          randomUUID(),
          '', // No owner in legacy mode
          this.extractProjectTitle(filename),
          chapters,
          chapters[0]?.getId() ?? null,
          new Date(),
          new Date()
        );

    // Persist if repository provided
    if (this.repository && userId) {
      await this.repository.createProject(userId, project);
    }

    return project;
  }

  private extractProjectTitle(filename: string): string {
    // Remove extension and use as title
    return filename.replace(/\.[^/.]+$/, '') || 'Nouveau projet';
  }
}
