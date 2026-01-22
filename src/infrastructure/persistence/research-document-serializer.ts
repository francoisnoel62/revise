// ABOUTME: Serialization utilities for ResearchDocument entity to/from MongoDB documents
// ABOUTME: Handles TipTap JSON content and Date conversions

import {
  ResearchDocument,
  ResearchDocumentProperties,
  ResearchDocumentType,
} from '@/domain/entities/ResearchDocument';
import { ObjectId } from 'mongodb';

export interface ResearchDocumentDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  type: ResearchDocumentType;
  title: string;
  content: Record<string, unknown> | null;
  url: string | null;
  sourceTitle: string | null;
  sourceAuthor: string | null;
  tags: string[];
  linkedChapterIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function serializeResearchDocument(doc: ResearchDocument): ResearchDocumentDocument {
  return {
    _id: new ObjectId(doc.getId()),
    projectId: doc.getProjectId(),
    ownerId: doc.getOwnerId(),
    type: doc.getType(),
    title: doc.getTitle(),
    content: doc.getContent(),
    url: doc.getUrl(),
    sourceTitle: doc.getSourceTitle(),
    sourceAuthor: doc.getSourceAuthor(),
    tags: doc.getTags(),
    linkedChapterIds: doc.getLinkedChapterIds(),
    createdAt: doc.getCreatedAt(),
    updatedAt: doc.getUpdatedAt(),
  };
}

export function deserializeResearchDocument(doc: ResearchDocumentDocument): ResearchDocument {
  const props: ResearchDocumentProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    type: doc.type,
    title: doc.title,
    content: doc.content,
    url: doc.url,
    sourceTitle: doc.sourceTitle,
    sourceAuthor: doc.sourceAuthor,
    tags: doc.tags,
    linkedChapterIds: doc.linkedChapterIds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return ResearchDocument.reconstruct(props);
}
