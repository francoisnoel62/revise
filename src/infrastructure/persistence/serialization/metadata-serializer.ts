// ABOUTME: Serialization utilities for ProjectMetadata <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import { ProjectMetadata, ProjectMetadataProperties } from '@/domain';

/**
 * MongoDB document shape for ProjectMetadata.
 */
export interface MetadataDocument {
  _id: string;
  projectId: string;
  ownerId: string;
  typeKey: string;
  title: string;
  content: string; // TipTap JSON stringified
  structuredData: string | null; // JSON-serialized AI output object, null for manual metadata
  properties: {
    wordCount: number;
    characterCount: number;
    lastEdited: Date;
    generatedAt: Date | null;
    isGenerated: boolean;
    contentHash: string | null; // SHA-256 hash of source text when generated
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert ProjectMetadata domain entity to MongoDB document.
 */
export function serializeMetadata(
  metadata: ProjectMetadata,
  ownerId: string
): MetadataDocument {
  const props = metadata.getProperties();

  return {
    _id: metadata.getId(),
    projectId: metadata.getProjectId(),
    ownerId,
    typeKey: metadata.getTypeKey(),
    title: metadata.getTitle(),
    content: metadata.getContent(),
    structuredData: metadata.getStructuredData(),
    properties: {
      wordCount: props.wordCount,
      characterCount: props.characterCount,
      lastEdited: props.lastEdited,
      generatedAt: props.generatedAt,
      isGenerated: props.isGenerated,
      contentHash: props.contentHash,
    },
    createdAt: new Date(), // Set on first insert
    updatedAt: new Date(),
  };
}

/**
 * Reconstruct ProjectMetadata domain entity from MongoDB document.
 */
export function deserializeMetadata(doc: MetadataDocument): ProjectMetadata {
  const properties: Partial<ProjectMetadataProperties> = {
    wordCount: doc.properties.wordCount,
    characterCount: doc.properties.characterCount,
    lastEdited: new Date(doc.properties.lastEdited),
    generatedAt: doc.properties.generatedAt
      ? new Date(doc.properties.generatedAt)
      : null,
    isGenerated: doc.properties.isGenerated,
    contentHash: doc.properties.contentHash ?? null, // Handle legacy documents without hash
  };

  return new ProjectMetadata(
    doc._id,
    doc.projectId,
    doc.typeKey,
    doc.title,
    doc.content,
    {
      ...properties,
      structuredData: doc.structuredData ?? null, // Handle legacy documents without this field
    }
  );
}
