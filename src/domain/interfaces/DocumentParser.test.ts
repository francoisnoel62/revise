import { describe, it, expect } from 'vitest';
import { DocumentParser } from './DocumentParser';
import { Chapter } from '../entities/Chapter';

describe('DocumentParser interface', () => {
  it('should define required methods', () => {
    const mockParser: DocumentParser = {
      supports: (_filename: string) => true,
      parseToChapters: async (_buffer: Buffer, _filename: string) => [],
      parse: async (_buffer: Buffer, _filename: string) => '',
    };

    expect(mockParser.supports).toBeDefined();
    expect(mockParser.parseToChapters).toBeDefined();
    expect(mockParser.parse).toBeDefined();
  });

  it('should return Chapter array from parseToChapters', async () => {
    const mockParser: DocumentParser = {
      supports: (_filename: string) => true,
      parseToChapters: async (_buffer: Buffer, _filename: string): Promise<Chapter[]> => {
        const content = JSON.stringify({ type: 'doc', content: [] });
        return [new Chapter('id-1', 'Test', content, 0)];
      },
      parse: async (_buffer: Buffer, _filename: string) => '',
    };

    const buffer = Buffer.from('test');
    const chapters = await mockParser.parseToChapters(buffer, 'test.docx');

    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toBeInstanceOf(Chapter);
  });
});
