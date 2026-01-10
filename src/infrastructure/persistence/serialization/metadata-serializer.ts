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
  properties: {
    wordCount: number;
    characterCount: number;
    lastEdited: Date;
    generatedAt: Date | null;
    isGenerated: boolean;
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
    properties: {
      wordCount: props.wordCount,
      characterCount: props.characterCount,
      lastEdited: props.lastEdited,
      generatedAt: props.generatedAt,
      isGenerated: props.isGenerated,
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
  };

  return new ProjectMetadata(
    doc._id,
    doc.projectId,
    doc.typeKey,
    doc.title,
    doc.content,
    properties
  );
}
