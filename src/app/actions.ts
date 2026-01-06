// ABOUTME: Server Actions for document import, export, and AI rewriting
// ABOUTME: Handles file operations and OpenAI integration on server side

'use server';

import { DocxParser } from '@/infrastructure/document/parsers/DocxParser';
import { DocxExporter } from '@/infrastructure/document/exporters/DocxExporter';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { RewriteTextUseCase } from '@/application/use-cases/RewriteTextUseCase';
import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

interface SerializedChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface SerializedProject {
  chapters: SerializedChapter[];
  activeChapterId: string | null;
}

/**
 * Import DOCX and parse into chapters
 */
export async function importDocument(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new DocxParser();

    const chapters = await parser.parseToChapters(buffer, file.name);
    const project = new Project(chapters);

    // Serialize for client
    return {
      project: {
        chapters: project.getChapters().map((ch) => ({
          id: ch.getId(),
          title: ch.getTitle(),
          content: ch.getContent(),
          order: ch.getOrder(),
          metadata: ch.getMetadata(),
        })),
        activeChapterId: project.getActiveChapterId(),
      },
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to import document',
    };
  }
}

/**
 * Export project as DOCX
 */
export async function exportProject(projectData: SerializedProject) {
  try {
    // Reconstruct Project from serialized data
    const project = reconstructProject(projectData);

    const exporter = new DocxExporter();
    const buffer = await exporter.exportProject(project, 'export.docx');

    return {
      buffer: Array.from(buffer), // Convert Buffer to array for JSON serialization
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to export document',
    };
  }
}

/**
 * Rewrite selected text using OpenAI
 */
export async function rewriteText(
  content: string, // TipTap JSON stringified
  selectionStart: number,
  selectionEnd: number
) {
  try {
    const startTime = Date.now();

    // Create temporary TextDocument for rewriting
    const doc = new TextDocument(content);
    const selection = new TextSelection(selectionStart, selectionEnd);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const llmProvider = new OpenAIProvider(apiKey);
    const useCase = new RewriteTextUseCase(llmProvider);

    const proposals = await useCase.execute(doc, selection);

    const duration = Date.now() - startTime;

    return {
      proposals: proposals.map((p) => ({
        content: p.content,
        styleLabel: p.styleLabel,
      })),
      duration,
    };
  } catch (error) {
    console.error('Rewrite error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to rewrite text',
    };
  }
}

/**
 * Helper: Reconstruct Project from serialized data
 */
function reconstructProject(projectData: SerializedProject): Project {
  const chapters = projectData.chapters.map(
    (chData: SerializedChapter) =>
      new Chapter(chData.id, chData.title, chData.content, chData.order)
  );

  const project = new Project(chapters);
  if (projectData.activeChapterId) {
    project.setActiveChapter(projectData.activeChapterId);
  }

  return project;
}
