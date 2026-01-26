// ABOUTME: Use case for exporting projects to DOCX format
// ABOUTME: Supports full project export, single chapter export, and selected chapters export

import { Project } from '@/domain/entities/Project';
import { DocumentExporter, ExportOptions } from '@/domain/interfaces/DocumentExporter';

export type ExportMode = 'all' | 'active' | 'selected';

export class ExportProjectUseCase {
  constructor(private exporter: DocumentExporter) {}

  async execute(
    project: Project,
    filename: string,
    mode: ExportMode = 'all',
    chapterIds?: string[],
    options?: ExportOptions
  ): Promise<Buffer> {
    if (!this.exporter.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    if (mode === 'active') {
      const activeChapter = project.getActiveChapter();
      if (!activeChapter) {
        throw new Error('No active chapter to export');
      }
      return await this.exporter.exportChapter(activeChapter, filename, options);
    }

    if (mode === 'selected') {
      if (!chapterIds || chapterIds.length === 0) {
        throw new Error('No chapters selected for export');
      }

      const allChapters = project.getChapters();
      const selectedChapters = allChapters.filter((ch) =>
        chapterIds.includes(ch.getId())
      );

      if (selectedChapters.length === 0) {
        throw new Error('No valid chapters found for export');
      }

      return await this.exporter.exportChapters(selectedChapters, filename, options);
    }

    return await this.exporter.exportProject(project, filename, options);
  }
}
