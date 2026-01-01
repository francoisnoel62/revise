// ABOUTME: Core domain entity representing a text document with content manipulation capabilities
// ABOUTME: Provides pure business logic for document operations with no framework dependencies

import { TextSelection } from '../value-objects/TextSelection';

export class TextDocument {
  private content: string;

  constructor(content: string = '') {
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }

  updateContent(newContent: string): void {
    this.content = newContent;
  }

  replaceSelection(selection: TextSelection, replacement: string): void {
    this.validateSelection(selection);

    const before = this.content.substring(0, selection.start);
    const after = this.content.substring(selection.end);
    this.content = before + replacement + after;
  }

  getSelectedText(selection: TextSelection): string {
    this.validateSelection(selection);
    return this.content.substring(selection.start, selection.end);
  }

  isEmpty(): boolean {
    return this.content.length === 0;
  }

  getLength(): number {
    return this.content.length;
  }

  private validateSelection(selection: TextSelection): void {
    if (selection.end > this.content.length) {
      throw new Error('Selection range exceeds document length');
    }
  }
}
