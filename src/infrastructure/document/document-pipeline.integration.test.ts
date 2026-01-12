// ABOUTME: Integration test for complete document pipeline (parse → modify → export)
// ABOUTME: Validates that .docx can be imported, modified, and exported successfully

import { describe, it, expect } from 'vitest';
import { DocxParser } from './parsers/DocxParser';
import { DocxExporter } from './exporters/DocxExporter';
import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { Chapter } from '@/domain/entities/Chapter';

describe('Document Pipeline Integration', () => {

  it('should parse, modify, and export docx', async () => {
    const parser = new DocxParser();
    const exporter = new DocxExporter();

    // Create a simple test .docx programmatically
    const originalContent = 'This is the original text.\n\nThis is a second paragraph.';
    const exportedBuffer = await exporter.export(originalContent, 'test.docx');

    // Parse it back
    const parsedContent = await parser.parse(exportedBuffer, 'test.docx');

    expect(parsedContent.trim()).toContain('original text');
    expect(parsedContent.trim()).toContain('second paragraph');

    // Modify using domain entity
    const document = new TextDocument(parsedContent);
    const selection = new TextSelection(0, 7); // "This is"
    document.replaceSelection(selection, 'Here is');

    // Export modified version
    const modifiedBuffer = await exporter.export(
      document.getContent(),
      'modified.docx'
    );

    expect(modifiedBuffer).toBeInstanceOf(Buffer);
    expect(modifiedBuffer.length).toBeGreaterThan(0);

    // Parse modified version to verify change
    const reparsedContent = await parser.parse(modifiedBuffer, 'modified.docx');
    expect(reparsedContent).toContain('Here is');
    expect(reparsedContent).not.toContain('This is the original');
  });

  it('should preserve multi-paragraph documents', async () => {
    const exporter = new DocxExporter();
    const parser = new DocxParser();

    const multiParagraph = `First paragraph with some content.

Second paragraph with different content.

Third paragraph to test structure.`;

    const buffer = await exporter.export(multiParagraph, 'multi.docx');
    const parsed = await parser.parse(buffer, 'multi.docx');

    // Should contain all paragraph content
    expect(parsed).toContain('First paragraph');
    expect(parsed).toContain('Second paragraph');
    expect(parsed).toContain('Third paragraph');
  });
});
