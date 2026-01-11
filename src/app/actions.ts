// ABOUTME: Main Server Actions for document operations.
// ABOUTME: Import creates persisted project, export loads from database.

'use server';

import { DocxParser } from '@/infrastructure/document/parsers/DocxParser';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { RewriteTextUseCase } from '@/application/use-cases/RewriteTextUseCase';
import { ExportProjectUseCase } from '@/application/use-cases/ExportProjectUseCase';
import { getPromptRepository } from '@/infrastructure/config/providers';
import {
  type ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getDocumentExporter,
  withErrorHandling,
} from './actions/utils';
import { type SerializedProject } from './actions/project-actions';

// === Serialization ===

function serializeProject(project: Project): SerializedProject {
  return {
    id: project.getId(),
    title: project.getTitle(),
    chapters: project.getChapters().map((ch) => ({
      id: ch.getId(),
      title: ch.getTitle(),
      content: ch.getContent(),
      order: ch.getOrder(),
      metadata: {
        wordCount: ch.getMetadata().wordCount,
        characterCount: ch.getMetadata().characterCount,
        lastEdited: ch.getMetadata().lastEdited.toISOString(),
      },
    })),
    activeChapterId: project.getActiveChapterId(),
    providerId: project.getProviderId(),
    createdAt: project.getCreatedAt().toISOString(),
    updatedAt: project.getUpdatedAt().toISOString(),
  };
}

// === Document Import ===

/**
 * Import a document file and create a new project.
 * Parses DOCX, splits by H1 headings, persists to database.
 */
export async function importDocument(
  formData: FormData
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new DocxParser();

    if (!parser.supports(file.name)) {
      throw new Error(`Unsupported file format: ${file.name}`);
    }

    const chapters = await parser.parseToChapters(buffer, file.name);

    // Auto-name chapters without titles
    chapters.forEach((chapter, index) => {
      if (!chapter.getTitle() || chapter.getTitle().trim() === '') {
        chapter.updateTitle(`Chapitre ${index + 1}`);
      }
    });

    // Extract title from filename
    const title = file.name.replace(/\.[^/.]+$/, '') || 'Document importé';

    // Create and persist project
    const project = Project.create(auth.userId, title, chapters);
    const repository = await getRepository();
    await repository.createProject(auth.userId, project);

    return serializeProject(project);
  });
}

// === Document Export ===

/**
 * Export a project to DOCX format.
 * Loads project from database by ID.
 */
export async function exportProject(
  projectId: string
): Promise<ActionResult<{ buffer: number[]; filename: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const exporter = await getDocumentExporter();
    const useCase = new ExportProjectUseCase(exporter);
    const filename = `${project.getTitle()}.docx`;
    const buffer = await useCase.execute(project, filename, 'all');

    return {
      buffer: Array.from(buffer),
      filename,
    };
  });
}

// === Legacy Export (for backward compatibility during migration) ===

interface LegacySerializedProject {
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
  activeChapterId: string | null;
}

/**
 * @deprecated Use exportProject(projectId) instead
 * Legacy export that accepts serialized project data directly.
 * Kept for backward compatibility during Phase 3.3 migration.
 */
export async function exportProjectLegacy(
  projectData: LegacySerializedProject
): Promise<{ buffer: number[] } | { error: string }> {
  try {
    const chapters = projectData.chapters.map(
      (chData) => new Chapter(chData.id, chData.title, chData.content, chData.order)
    );

    // Create temporary project for export (not persisted)
    const project = new Project(
      'temp-export',
      '',
      'Export',
      chapters,
      projectData.activeChapterId,
      null, // providerId
      new Date(),
      new Date()
    );

    const exporter = await getDocumentExporter();
    const useCase = new ExportProjectUseCase(exporter);
    const buffer = await useCase.execute(project, 'export.docx', 'all');

    return { buffer: Array.from(buffer) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// === AI Rewriting ===

interface RewriteResult {
  proposals: Array<{ content: string; styleLabel: string }>;
  duration: number;
}

/**
 * Rewrite selected text using AI.
 * Does not require project persistence - operates on content directly.
 */
export async function rewriteText(
  content: string,
  selectionStart: number,
  selectionEnd: number
): Promise<RewriteResult | { error: string }> {
  // Note: rewriteText doesn't require auth in current design
  // It operates on content passed directly, not stored data
  // Consider adding auth if usage tracking is needed

  const startTime = Date.now();

  try {
    const document = new TextDocument(content);
    const selection = new TextSelection(selectionStart, selectionEnd);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const promptRepo = getPromptRepository();
    const provider = new OpenAIProvider(apiKey, promptRepo);
    const useCase = new RewriteTextUseCase(provider);

    const proposals = await useCase.execute(document, selection);

    return {
      proposals: proposals.map((p) => ({
        content: p.content,
        styleLabel: p.styleLabel || 'Variant',
      })),
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Rewrite failed',
    };
  }
}
