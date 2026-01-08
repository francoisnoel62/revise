// ABOUTME: Serialization utilities for Project <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

/**
 * MongoDB document shape for Project.
 */
export interface ProjectDocument {
  _id: string;
  ownerId: string;
  title: string;
  chapters: ChapterDocument[];
  activeChapterId: string | null;
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB embedded document shape for Chapter.
 */
export interface ChapterDocument {
  id: string;
  title: string;
  content: string;
  order: number;
  metadata: {
    wordCount: number;
    characterCount: number;
    lastEdited: Date;
  };
}

/**
 * Convert Project domain entity to MongoDB document.
 */
export function serializeProject(project: Project): ProjectDocument {
  return {
    _id: project.getId(),
    ownerId: project.getOwnerId(),
    title: project.getTitle(),
    chapters: project.getChapters().map(serializeChapter),
    activeChapterId: project.getActiveChapterId(),
    providerId: project.getProviderId(),
    createdAt: project.getCreatedAt(),
    updatedAt: project.getUpdatedAt(),
  };
}

/**
 * Convert Chapter domain entity to MongoDB embedded document.
 */
export function serializeChapter(chapter: Chapter): ChapterDocument {
  return {
    id: chapter.getId(),
    title: chapter.getTitle(),
    content: chapter.getContent(),
    order: chapter.getOrder(),
    metadata: chapter.getMetadata(),
  };
}

/**
 * Reconstruct Project domain entity from MongoDB document.
 */
export function deserializeProject(doc: ProjectDocument): Project {
  const chapters = doc.chapters
    .sort((a, b) => a.order - b.order)
    .map(deserializeChapter);

  return new Project(
    doc._id,
    doc.ownerId,
    doc.title,
    chapters,
    doc.activeChapterId,
    doc.providerId ?? null,
    new Date(doc.createdAt),
    new Date(doc.updatedAt)
  );
}

/**
 * Reconstruct Chapter domain entity from MongoDB embedded document.
 */
export function deserializeChapter(doc: ChapterDocument): Chapter {
  return new Chapter(doc.id, doc.title, doc.content, doc.order);
}
