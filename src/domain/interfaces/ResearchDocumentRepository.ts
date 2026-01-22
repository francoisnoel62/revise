// ABOUTME: Repository interface for ResearchDocument persistence
// ABOUTME: Defines contract for storing and querying research documents

import { ResearchDocument, ResearchDocumentType } from '../entities/ResearchDocument';

export interface ResearchDocumentFilters {
  type?: ResearchDocumentType;
  tag?: string;
  linkedChapterId?: string;
}

export interface ResearchDocumentRepository {
  create(userId: string, document: ResearchDocument): Promise<ResearchDocument>;
  findById(userId: string, documentId: string): Promise<ResearchDocument | null>;
  findByProjectId(
    userId: string,
    projectId: string,
    filters?: ResearchDocumentFilters
  ): Promise<ResearchDocument[]>;
  countByProjectId(userId: string, projectId: string): Promise<number>;
  getAllTags(userId: string, projectId: string): Promise<string[]>;
  update(userId: string, document: ResearchDocument): Promise<ResearchDocument>;
  delete(userId: string, documentId: string): Promise<void>;
  deleteAllByProject(userId: string, projectId: string): Promise<void>;
  deleteAllByOwner(userId: string): Promise<void>;
}
