import { describe, it, expect } from 'vitest';
import { DocumentExporter } from './DocumentExporter';
import { Project } from '../entities/Project';
import { Chapter } from '../entities/Chapter';

describe('DocumentExporter interface', () => {
  it('should define required methods', () => {
    const mockExporter: DocumentExporter = {
      supports: (_filename: string) => true,
      exportProject: async (_project: Project, _filename: string) => Buffer.from(''),
      exportChapters: async (_chapters: Chapter[], _filename: string) => Buffer.from(''),
      exportChapter: async (_chapter: Chapter, _filename: string) => Buffer.from(''),
      export: async (_content: string, _filename: string) => Buffer.from(''),
    };

    expect(mockExporter.supports).toBeDefined();
    expect(mockExporter.exportProject).toBeDefined();
    expect(mockExporter.exportChapter).toBeDefined();
    expect(mockExporter.export).toBeDefined();
  });
});
