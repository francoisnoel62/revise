// ABOUTME: Use case for exporting projects to DOCX format
// ABOUTME: Supports both full project export and single chapter export

import { Project } from '@/domain/entities/Project';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';

export type ExportMode = 'all' | 'active';

export class ExportProjectUseCase {
  constructor(private exporter: DocumentExporter) {}

  async execute(
    project: Project,
    filename: string,
    mode: ExportMode = 'all'
  ): Promise<Buffer> {
    if (!this.exporter.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    if (mode === 'active') {
      const activeChapter = project.getActiveChapter();
      if (!activeChapter) {
        throw new Error('No active chapter to export');
      }
      return await this.exporter.exportChapter(activeChapter, filename);
    }

    return await this.exporter.exportProject(project, filename);
  }
}
