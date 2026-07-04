// ABOUTME: Main Server Actions for document operations.
// ABOUTME: Import creates persisted project, export loads from database.

'use server';

import { Project } from '@/domain/entities/Project';
import { ImportProjectUseCase } from '@/application/use-cases/ImportProjectUseCase';
import { ImportFolderUseCase } from '@/application/use-cases/ImportFolderUseCase';
import { FolderFile } from '@/domain/interfaces/FolderParser';
import { Chapter } from '@/domain/entities/Chapter';
import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { RewriteTextUseCase } from '@/application/use-cases/RewriteTextUseCase';
import { ExportProjectUseCase, ExportMode } from '@/application/use-cases/ExportProjectUseCase';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { getPromptRepository } from '@/infrastructure/config/providers';
import {
  type ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getDocumentParser,
  getFolderParser,
  getDocumentExporter,
  getProjectSettingsRepo,
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
 * Supports .docx and .md files, splits by H1 headings, persists to database.
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
    const parser = await getDocumentParser();
    const repository = await getRepository();

    const useCase = new ImportProjectUseCase(parser, repository);
    const project = await useCase.execute(auth.userId, buffer, file.name);

    return serializeProject(project);
  });
}

/**
 * Import a folder of Markdown files and create a new project.
 * Each .md file becomes a chapter, ordered by path and numeric prefix.
 */
export async function importFolder(
  formData: FormData
): Promise<ActionResult<SerializedProject>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const title = formData.get('title') as string;
    const files = formData.getAll('files') as File[];
    const paths = formData.getAll('paths') as string[];

    if (!files || files.length === 0) {
      throw new Error('Aucun fichier fourni');
    }

    // Convert File objects to FolderFile format
    const folderFiles: FolderFile[] = await Promise.all(
      files.map(async (file, index) => ({
        relativePath: paths[index] || file.name,
        name: file.name,
        buffer: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const parser = await getFolderParser();
    const repository = await getRepository();

    const projectTitle = title?.trim() || 'Nouveau projet';
    const useCase = new ImportFolderUseCase(parser, repository);
    const project = await useCase.execute(auth.userId, folderFiles, projectTitle);

    return serializeProject(project);
  });
}

// === Document Export ===

/**
 * Export a project to DOCX format.
 * Loads project from database by ID.
 * Includes cover image as first page if one is set in project settings.
 * @param projectId - The project to export
 * @param chapterIds - Optional list of chapter IDs to export. If not provided, all chapters are exported.
 */
export async function exportProject(
  projectId: string,
  chapterIds?: string[]
): Promise<ActionResult<{ buffer: number[]; filename: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Get project settings for cover image and the active publication profile
    const settingsRepo = await getProjectSettingsRepo();
    const settings = await settingsRepo.findByProjectId(auth.userId, projectId);
    const coverImageUrl = settings?.getCoverImageUrl();
    const profileId = settings?.getPublicationProfileId() ?? 'kdp-6x9';

    if (profileId !== 'passerelle') {
      throw new Error(
        'Le profil de publication actif exporte en PDF. Changez de profil pour exporter en DOCX.'
      );
    }

    const exporter = await getDocumentExporter('docx');
    const useCase = new ExportProjectUseCase(exporter);
    const filename = `${project.getTitle()}.docx`;

    const mode: ExportMode = chapterIds && chapterIds.length > 0 ? 'selected' : 'all';
    const buffer = await useCase.execute(project, filename, mode, chapterIds, {
      coverImageUrl,
    });

    return {
      buffer: Array.from(buffer),
      filename,
    };
  });
}

/**
 * Export a project to PDF format.
 * Loads project from database by ID.
 * Includes cover image as first page if one is set in project settings.
 * @param projectId - The project to export
 * @param chapterIds - Optional list of chapter IDs to export. If not provided, all chapters are exported.
 */
export async function exportProjectPdf(
  projectId: string,
  chapterIds?: string[]
): Promise<ActionResult<{ buffer: number[]; filename: string }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Get project settings for cover image and the active publication profile
    const settingsRepo = await getProjectSettingsRepo();
    const settings = await settingsRepo.findByProjectId(auth.userId, projectId);
    const coverImageUrl = settings?.getCoverImageUrl();
    const profileId = settings?.getPublicationProfileId() ?? 'kdp-6x9';

    if (profileId === 'passerelle') {
      throw new Error(
        'Le profil de publication actif exporte en DOCX. Changez de profil pour exporter en PDF.'
      );
    }

    const publicationProfile = PublicationProfile.fromId(profileId);

    const exporter = await getDocumentExporter('pdf');
    const useCase = new ExportProjectUseCase(exporter);
    const filename = `${project.getTitle()}.pdf`;

    const mode: ExportMode = chapterIds && chapterIds.length > 0 ? 'selected' : 'all';
    const buffer = await useCase.execute(project, filename, mode, chapterIds, {
      coverImageUrl,
      publicationProfile,
    });

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
