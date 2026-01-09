// ABOUTME: Test suite for ExportProjectUseCase validating project export logic
// ABOUTME: Tests both full project and single chapter export modes

import { describe, it, expect, beforeEach } from 'vitest';
import { ExportProjectUseCase } from './ExportProjectUseCase';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

// Test double for DocumentExporter
class MockDocumentExporter implements DocumentExporter {
  private lastExportedProject: Project | null = null;
  private lastExportedChapter: Chapter | null = null;

  async exportProject(project: Project, _filename: string): Promise<Buffer> {
    this.lastExportedProject = project;
    return Buffer.from('exported project buffer');
  }

  async exportChapter(chapter: Chapter, _filename: string): Promise<Buffer> {
    this.lastExportedChapter = chapter;
    return Buffer.from('exported chapter buffer');
  }

  async export(_content: string, _filename: string): Promise<Buffer> {
    throw new Error('Not used in Phase 2');
  }

  supports(filename: string): boolean {
    return filename.endsWith('.docx');
  }

  getLastExportedProject(): Project | null {
    return this.lastExportedProject;
  }

  getLastExportedChapter(): Chapter | null {
    return this.lastExportedChapter;
  }
}

describe('ExportProjectUseCase', () => {
  let mockExporter: MockDocumentExporter;
  let useCase: ExportProjectUseCase;

  beforeEach(() => {
    mockExporter = new MockDocumentExporter();
    useCase = new ExportProjectUseCase(mockExporter);
  });

  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  describe('exportProject - all mode', () => {
    it('should export entire project with all chapters', async () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = Project.create('test-user', 'Test Project', chapters);
      const filename = 'test.docx';

      const result = await useCase.execute(project, filename, 'all');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('exported project buffer');
      expect(mockExporter.getLastExportedProject()).toBe(project);
    });

    it('should default to "all" mode when mode not specified', async () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = Project.create('test-user', 'Test Project', [chapter]);
      const filename = 'test.docx';

      const result = await useCase.execute(project, filename);

      expect(result.toString()).toBe('exported project buffer');
      expect(mockExporter.getLastExportedProject()).toBe(project);
    });
  });

  describe('exportProject - active mode', () => {
    it('should export only active chapter', async () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = Project.create('test-user', 'Test Project', chapters);
      project.setActiveChapter('id-2');
      const filename = 'test.docx';

      const result = await useCase.execute(project, filename, 'active');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('exported chapter buffer');
      expect(mockExporter.getLastExportedChapter()?.getId()).toBe('id-2');
    });

    it('should throw error when no active chapter in active mode', async () => {
      const project = Project.create('test-user', 'Test Project', []); // Truly empty project
      const filename = 'test.docx';

      await expect(async () => {
        await useCase.execute(project, filename, 'active');
      }).rejects.toThrow('No active chapter to export');
    });
  });

  describe('format validation', () => {
    it('should throw error for unsupported format', async () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = Project.create('test-user', 'Test Project', [chapter]);
      const filename = 'test.pdf';

      await expect(async () => {
        await useCase.execute(project, filename);
      }).rejects.toThrow('Unsupported export format: test.pdf');
    });
  });

  describe('error propagation', () => {
    it('should propagate exporter errors', async () => {
      const failingExporter: DocumentExporter = {
        async exportProject() {
          throw new Error('Export failed');
        },
        async exportChapter() {
          throw new Error('Export failed');
        },
        async export() {
          throw new Error('Not used');
        },
        supports() {
          return true;
        },
      };
      const failingUseCase = new ExportProjectUseCase(failingExporter);
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = Project.create('test-user', 'Test Project', [chapter]);

      await expect(async () => {
        await failingUseCase.execute(project, 'test.docx');
      }).rejects.toThrow('Export failed');
    });
  });
});
