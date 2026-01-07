import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import { IndentParagraph } from './IndentParagraph';

describe('IndentParagraph', () => {
  const createEditor = (content = '<p>Hello world</p>') => {
    return new Editor({
      extensions: [
        Document,
        IndentParagraph,
        Text,
      ],
      content,
    });
  };

  it('should be defined', () => {
    expect(IndentParagraph).toBeDefined();
  });

  it('should toggle indent on current paragraph', () => {
    const editor = createEditor('<p>Hello world</p>');

    // Place cursor in paragraph
    editor.commands.setTextSelection(3);

    // Toggle indent
    editor.chain().focus().toggleIndent().run();

    // Check if indent is set
    const attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBe(true);

    editor.destroy();
  });

  it('should remove indent when toggled again', () => {
    const editor = createEditor('<p>Hello world</p>');

    editor.commands.setTextSelection(3);

    // Toggle on
    editor.chain().focus().toggleIndent().run();
    let attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBe(true);

    // Toggle off
    editor.chain().focus().toggleIndent().run();
    attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBeUndefined();

    editor.destroy();
  });

  it('should set indent explicitly', () => {
    const editor = createEditor('<p>Hello world</p>');

    editor.commands.setTextSelection(3);

    // Set indent
    editor.chain().focus().setIndent(true).run();

    const attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBe(true);

    editor.destroy();
  });

  it('should unset indent explicitly', () => {
    const editor = createEditor('<p>Hello world</p>');

    editor.commands.setTextSelection(3);

    // Set then unset
    editor.chain().focus().setIndent(true).run();
    editor.chain().focus().setIndent(false).run();

    const attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBeUndefined();

    editor.destroy();
  });

  it('should apply indent to specific paragraph in multi-paragraph document', () => {
    const editor = createEditor('<p>First paragraph</p><p>Second paragraph</p>');

    // Indent only second paragraph
    editor.commands.setTextSelection(20); // Position in second paragraph
    editor.chain().focus().toggleIndent().run();

    // Check second paragraph is indented
    editor.commands.setTextSelection(20);
    let attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBe(true);

    // Check first paragraph is NOT indented
    editor.commands.setTextSelection(3);
    attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBeUndefined();

    editor.destroy();
  });

  it('should preserve other paragraph attributes when setting indent', () => {
    const editor = createEditor('<p>Hello world</p>');

    editor.commands.setTextSelection(3);

    // Set indent
    editor.chain().focus().toggleIndent().run();

    // Paragraph should still be a paragraph (not change type)
    expect(editor.isActive('paragraph')).toBe(true);

    editor.destroy();
  });

  it('should render paragraph with data-indent attribute', () => {
    const editor = createEditor('<p>Hello world</p>');

    editor.commands.setTextSelection(3);
    editor.chain().focus().toggleIndent().run();

    // Get HTML
    const html = editor.getHTML();

    // Should contain data-indent="true"
    expect(html).toContain('data-indent="true"');

    editor.destroy();
  });

  it('should parse paragraph with data-indent attribute from HTML', () => {
    const editor = createEditor('<p data-indent="true">Hello world</p>');

    // Check if indent is parsed
    editor.commands.setTextSelection(3);
    const attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBe(true);

    editor.destroy();
  });

  it('should work with new paragraphs created by Enter key', () => {
    const editor = createEditor('<p>Hello</p>');

    // Set indent on first paragraph
    editor.commands.setTextSelection(3);
    editor.chain().focus().toggleIndent().run();

    // Create new paragraph (simulating Enter key)
    editor.commands.setTextSelection(6); // End of "Hello"
    editor.commands.splitBlock();

    // New paragraph SHOULD inherit indent (keepOnSplit: true)
    editor.commands.setTextSelection(8); // In new paragraph
    const attrs = editor.getAttributes('paragraph');
    expect(attrs.indent).toBe(true);

    editor.destroy();
  });

  it('should not affect headings or other block types', () => {
    const editor = createEditor('<h1>Heading</h1><p>Paragraph</p>');

    // Try to toggle indent on heading
    editor.commands.setTextSelection(3); // In heading
    editor.chain().focus().toggleIndent().run();

    // Indent should not work on headings
    const headingAttrs = editor.getAttributes('heading');
    expect(headingAttrs.indent).toBeUndefined();

    // But should work on paragraph
    editor.commands.setTextSelection(15); // In paragraph
    editor.chain().focus().toggleIndent().run();
    const paraAttrs = editor.getAttributes('paragraph');
    expect(paraAttrs.indent).toBe(true);

    editor.destroy();
  });
});
