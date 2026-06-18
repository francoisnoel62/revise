// ABOUTME: Serialization utilities for CanonFact to/from MongoDB documents
// ABOUTME: Handles ObjectId and Date conversions for the canon ledger collection

import { CanonFact, CanonFactProperties } from '@/domain/entities/CanonFact';
import { CanonFactSource } from '@/domain/value-objects/CanonFactSource';
import type { CanonFactCategory } from '@/domain/value-objects/CanonFacts';
import { ObjectId } from 'mongodb';

export interface CanonFactDocument {
  _id: ObjectId;
  ownerId: string;
  projectId: string;
  entity: string;
  statement: string;
  validFromChapter: number;
  validToChapter: number | null;
  source: CanonFactSource;
  sourceChapterId: string | null;
  contentHash: string | null;
  category?: CanonFactCategory;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeCanonFact(fact: CanonFact): CanonFactDocument {
  return {
    _id: new ObjectId(fact.getId()),
    ownerId: fact.getOwnerId(),
    projectId: fact.getProjectId(),
    entity: fact.getEntity(),
    statement: fact.getStatement(),
    validFromChapter: fact.getValidFromChapter(),
    validToChapter: fact.getValidToChapter(),
    source: fact.getSource(),
    sourceChapterId: fact.getSourceChapterId(),
    contentHash: fact.getContentHash(),
    category: fact.getCategory(),
    createdAt: fact.getCreatedAt(),
    updatedAt: fact.getUpdatedAt(),
  };
}

export function deserializeCanonFact(doc: CanonFactDocument): CanonFact {
  const props: CanonFactProperties = {
    id: doc._id.toHexString(),
    ownerId: doc.ownerId,
    projectId: doc.projectId,
    entity: doc.entity,
    statement: doc.statement,
    validFromChapter: doc.validFromChapter,
    validToChapter: doc.validToChapter ?? null,
    source: doc.source,
    sourceChapterId: doc.sourceChapterId ?? null,
    contentHash: doc.contentHash ?? null,
    category: doc.category,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return CanonFact.reconstruct(props);
}
