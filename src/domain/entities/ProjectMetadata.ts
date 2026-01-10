// ABOUTME: Domain entity representing a project metadata document
// ABOUTME: Stores AI-generated or user-edited analysis content (TipTap JSON)

import { isValidMetadataType } from '../value-objects/MetadataType';

export interface ProjectMetadataProperties {
  wordCount: number;
  characterCount: number;
  lastEdited: Date;
  generatedAt: Date | null;
  isGenerated: boolean;
  contentHash: string | null; // SHA-256 hash of source text when generated
}

export class ProjectMetadata {
  private readonly id: string;
  private readonly projectId: string;
  private readonly typeKey: string;
  private title: string;
  private content: string; // TipTap JSON stringified
  private properties: ProjectMetadataProperties;

  constructor(
    id: string,
    projectId: string,
    typeKey: string,
    title: string,
    content: string,
    properties?: Partial<ProjectMetadataProperties>
  ) {
    // Validate ID
    if (!id || id.trim().length === 0) {
      throw new Error('Metadata ID cannot be empty');
    }

    // Validate projectId
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    // Validate typeKey
    if (!typeKey || typeKey.trim().length === 0) {
      throw new Error('Metadata type key cannot be empty');
    }
    if (!isValidMetadataType(typeKey)) {
      throw new Error(`Invalid metadata type: ${typeKey}`);
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      throw new Error('Metadata title cannot be empty');
    }

    // Validate content (TipTap JSON)
    this.validateTipTapJSON(content);

    this.id = id;
    this.projectId = projectId;
    this.typeKey = typeKey;
    this.title = title.trim();
    this.content = content;
    this.properties = {
      wordCount: properties?.wordCount ?? 0,
      characterCount: properties?.characterCount ?? 0,
      lastEdited: properties?.lastEdited ?? new Date(),
      generatedAt: properties?.generatedAt ?? null,
      isGenerated: properties?.isGenerated ?? false,
      contentHash: properties?.contentHash ?? null,
    };

    // Update word/character counts from content
    this.updateContentMetrics();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getTypeKey(): string {
    return this.typeKey;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }

  getProperties(): ProjectMetadataProperties {
    return { ...this.properties };
  }

  isGenerated(): boolean {
    return this.properties.isGenerated;
  }

  // Mutations
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error('Metadata title cannot be empty');
    }
    this.title = newTitle.trim();
    this.properties.lastEdited = new Date();
  }

  updateContent(newContent: string, contentHash?: string): void {
    this.validateTipTapJSON(newContent);
    this.content = newContent;
    this.updateContentMetrics();
    this.properties.lastEdited = new Date();

    // Update content hash if provided (for AI-generated content)
    if (contentHash !== undefined) {
      this.properties.contentHash = contentHash;
    }
  }

  markAsGenerated(): void {
    this.properties.generatedAt = new Date();
    this.properties.isGenerated = true;
    this.properties.lastEdited = new Date();
  }

  /**
   * Check if metadata needs regeneration based on content hash.
   * Returns true if:
   * - Metadata was never generated
   * - Content hash is missing (legacy data)
   * - Current text hash differs from stored hash
   *
   * @param currentTextHash - SHA-256 hash of current project text
   * @returns true if regeneration is needed, false if cache can be used
   */
  needsRegeneration(currentTextHash: string): boolean {
    // Never generated - needs generation
    if (!this.properties.isGenerated) {
      return true;
    }

    // No hash stored (legacy data) - needs regeneration to store hash
    if (!this.properties.contentHash) {
      return true;
    }

    // Content changed - needs regeneration
    return this.properties.contentHash !== currentTextHash;
  }

  // Static factory for creating empty metadata
  static createEmpty(
    id: string,
    projectId: string,
    typeKey: string,
    title: string
  ): ProjectMetadata {
    const emptyContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });

    return new ProjectMetadata(id, projectId, typeKey, title, emptyContent);
  }

  // Static factory for creating generated metadata with content hash
  static createGenerated(
    id: string,
    projectId: string,
    typeKey: string,
    title: string,
    content: string,
    contentHash: string
  ): ProjectMetadata {
    const metadata = new ProjectMetadata(id, projectId, typeKey, title, content, {
      contentHash,
      isGenerated: true,
      generatedAt: new Date(),
    });

    return metadata;
  }

  // Private helpers
  private validateTipTapJSON(content: string): void {
    try {
      const json = JSON.parse(content);
      if (!json.type || json.type !== 'doc') {
        throw new Error('Invalid TipTap JSON: must have type "doc"');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format for metadata content');
      }
      throw error;
    }
  }

  private updateContentMetrics(): void {
    try {
      const json = JSON.parse(this.content);
      this.properties.wordCount = this.calculateWordCount(json);
      this.properties.characterCount = this.calculateCharacterCount(json);
    } catch {
      // Keep previous metrics if parsing fails
    }
  }

  private calculateWordCount(json: unknown): number {
    const text = this.extractTextFromTipTapJSON(json);
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }

  private calculateCharacterCount(json: unknown): number {
    const text = this.extractTextFromTipTapJSON(json);
    return text.length;
  }

  private extractTextFromTipTapJSON(json: unknown): string {
    if (!json || typeof json !== 'object') return '';

    const node = json as Record<string, unknown>;

    if (node.type === 'text' && typeof node.text === 'string') {
      return node.text;
    }

    if (Array.isArray(node.content)) {
      return node.content
        .map((child) => this.extractTextFromTipTapJSON(child))
        .join(' ');
    }

    return '';
  }
}
