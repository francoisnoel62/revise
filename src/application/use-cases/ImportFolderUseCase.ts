// ABOUTME: Use case for importing a folder of Markdown files as a multi-chapter project.
// ABOUTME: Each .md file becomes a chapter, ordered by path and numeric prefix.

import { FolderParser, FolderFile } from '@/domain/interfaces/FolderParser';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { Project } from '@/domain/entities/Project';

export class ImportFolderUseCase {
  constructor(
    private parser: FolderParser,
    private repository: ProjectRepository
  ) {}

  /**
   * Import a folder of Markdown files as a new project.
   * @param userId Owner of the project
   * @param files Array of files with their relative paths
   * @param projectTitle Title for the new project
   * @returns Created Project (persisted)
   */
  async execute(
    userId: string,
    files: FolderFile[],
    projectTitle: string
  ): Promise<Project> {
    if (!this.parser.supports(files)) {
      throw new Error('Aucun fichier .md trouvé dans le dossier');
    }

    const chapters = await this.parser.parseToChapters(files);

    if (chapters.length === 0) {
      throw new Error('Aucun chapitre créé à partir du dossier');
    }

    // Create project with the specified title
    const project = Project.create(userId, projectTitle, chapters);

    // Persist to database
    await this.repository.createProject(userId, project);

    return project;
  }
}
