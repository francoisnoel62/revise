// ABOUTME: Unit tests for metadata serialization utilities
// ABOUTME: Covers structuredData field including backward compat with legacy documents

import { describe, it, expect } from 'vitest';
import { serializeMetadata, deserializeMetadata, MetadataDocument } from '../metadata-serializer';
import { ProjectMetadata } from '@/domain';

const validContent = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test' }] }],
});

const makeMetadata = (structuredData?: string | null): ProjectMetadata =>
  ProjectMetadata.createGenerated(
    'meta-1',
    'project-1',
    'narrative-analysis',
    'Analyse Narrative',
    validContent,
    'hash-abc',
    structuredData
  );

describe('serializeMetadata', () => {
  it('should include structuredData in the document', () => {
    const data = JSON.stringify({ narratorType: 'Première personne' });
    const doc = serializeMetadata(makeMetadata(data), 'owner-1');
    expect(doc.structuredData).toBe(data);
  });

  it('should serialize null structuredData', () => {
    const doc = serializeMetadata(makeMetadata(null), 'owner-1');
    expect(doc.structuredData).toBeNull();
  });

  it('should include all required fields', () => {
    const doc = serializeMetadata(makeMetadata(), 'owner-1');
    expect(doc._id).toBe('meta-1');
    expect(doc.projectId).toBe('project-1');
    expect(doc.ownerId).toBe('owner-1');
    expect(doc.typeKey).toBe('narrative-analysis');
    expect(doc.content).toBe(validContent);
  });
});

describe('deserializeMetadata', () => {
  const baseDoc: MetadataDocument = {
    _id: 'meta-1',
    projectId: 'project-1',
    ownerId: 'owner-1',
    typeKey: 'narrative-analysis',
    title: 'Analyse Narrative',
    content: validContent,
    structuredData: null,
    properties: {
      wordCount: 1,
      characterCount: 4,
      lastEdited: new Date(),
      generatedAt: new Date(),
      isGenerated: true,
      contentHash: 'hash-abc',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should reconstruct structuredData from document', () => {
    const data = JSON.stringify({ narratorType: 'Troisième personne', narrativeVoice: ['Ironie'] });
    const doc = { ...baseDoc, structuredData: data };
    const metadata = deserializeMetadata(doc);
    expect(metadata.getStructuredData()).toBe(data);
  });

  it('should handle null structuredData', () => {
    const metadata = deserializeMetadata({ ...baseDoc, structuredData: null });
    expect(metadata.getStructuredData()).toBeNull();
  });

  it('should handle legacy documents without structuredData field (backward compat)', () => {
    // Simulate a MongoDB document created before this migration
    const legacyDoc = { ...baseDoc } as Partial<MetadataDocument>;
    delete (legacyDoc as Record<string, unknown>).structuredData;
    const metadata = deserializeMetadata(legacyDoc as MetadataDocument);
    expect(metadata.getStructuredData()).toBeNull();
  });
});
