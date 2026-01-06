// ABOUTME: Core domain entity representing a single chapter with rich text content
// ABOUTME: Provides pure business logic for chapter operations with no framework dependencies

export interface ChapterMetadata {
  wordCount: number;
  characterCount: number;
  lastEdited: Date;
}

export class Chapter {
  private readonly id: string;
  private title: string;
  private content: string; // TipTap JSON stringified
  private order: number;
  private metadata: ChapterMetadata;

  constructor(
    id: string,
    title: string,
    content: string,
    order: number
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.order = order;
    this.metadata = {
      wordCount: 0,
      characterCount: 0,
      lastEdited: new Date(),
    };
    this.updateMetadata();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }

  getOrder(): number {
    return this.order;
  }

  getMetadata(): ChapterMetadata {
    return { ...this.metadata };
  }

  // Mutations
  updateTitle(newTitle: string): void {
    if (newTitle.trim().length === 0) {
      throw new Error('Chapter title cannot be empty');
    }
    this.title = newTitle.trim();
  }

  updateContent(newContent: string): void {
    this.validateTipTapJSON(newContent);
    this.content = newContent;
    this.updateMetadata();
  }

  reorder(newOrder: number): void {
    if (newOrder < 0) {
      throw new Error('Chapter order must be non-negative');
    }
    this.order = newOrder;
  }

  // Private helpers
  private updateMetadata(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = JSON.parse(this.content);
      this.metadata.wordCount = this.calculateWordCount(json);
      this.metadata.characterCount = this.calculateCharacterCount(json);
      this.metadata.lastEdited = new Date();
    } catch {
      // If JSON parsing fails, keep previous metadata
      this.metadata.lastEdited = new Date();
    }
  }

  private validateTipTapJSON(content: string): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = JSON.parse(content);
      if (!json.type || json.type !== 'doc') {
        throw new Error('Invalid TipTap JSON: must have type "doc"');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format for chapter content');
      }
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateWordCount(json: any): number {
    const text = this.extractTextFromTipTapJSON(json);
    if (!text.trim()) return 0;

    // Split by whitespace and filter empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateCharacterCount(json: any): number {
    const text = this.extractTextFromTipTapJSON(json);
    return text.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractTextFromTipTapJSON(json: any): string {
    // Recursively extract text from TipTap JSON structure
    if (!json) return '';

    if (json.type === 'text' && json.text) {
      return json.text;
    }

    if (json.content && Array.isArray(json.content)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return json.content.map((node: any) => this.extractTextFromTipTapJSON(node)).join(' ');
    }

    return '';
  }
}
