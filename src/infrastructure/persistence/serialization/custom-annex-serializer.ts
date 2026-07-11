// ABOUTME: Serialization between CustomAnnex domain entity and its MongoDB document.
// ABOUTME: Handles multi-tenant ownerId and reconstruction from stored documents.

import { CustomAnnex, type AnnexPlacement } from '@/domain/entities/CustomAnnex';

export interface CustomAnnexDocument {
  _id: string;
  projectId: string;
  ownerId: string;
  title: string;
  content: string; // TipTap JSON stringified
  placement: AnnexPlacement;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeCustomAnnex(annex: CustomAnnex, ownerId: string): CustomAnnexDocument {
  return {
    _id: annex.getId(),
    projectId: annex.getProjectId(),
    ownerId,
    title: annex.getTitle(),
    content: annex.getContent(),
    placement: annex.getPlacement(),
    order: annex.getOrder(),
    createdAt: annex.getCreatedAt(),
    updatedAt: annex.getUpdatedAt(),
  };
}

export function deserializeCustomAnnex(doc: CustomAnnexDocument): CustomAnnex {
  return new CustomAnnex(
    doc._id,
    doc.projectId,
    doc.title,
    doc.content,
    doc.placement,
    doc.order,
    {
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    },
  );
}
