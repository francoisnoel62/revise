// ABOUTME: Core domain entity representing a text document with content
// ABOUTME: Pure business logic with no framework dependencies

export class TextDocument {
  private content: string;

  constructor(content: string = '') {
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }
}
