// ABOUTME: Orchestrates the one-shot titre-de-chapitre H1 migration for all chapters of a given user.
// ABOUTME: Idempotent — chapters already starting with the semantic heading are skipped.

import { Chapter } from '@/domain/entities/Chapter';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ensureChapterTitleHeading } from './ChapterTitleHeadingMigration';

export interface ChapterHeadingMigrationResult {
  chapterId: string;
  chapterTitle: string;
  wasAlreadyPresent: boolean;
}

export interface ProjectHeadingMigrationResult {
  projectId: string;
  projectTitle: string;
  chapters: ChapterHeadingMigrationResult[];
}

export interface HeadingMigrationReport {
  projects: ProjectHeadingMigrationResult[];
  totalChaptersScanned: number;
  totalChaptersMigrated: number;
}

export interface MigrateHeadingsOptions {
  dryRun?: boolean;
}

export class MigrateChapterTitleHeadingsUseCase {
  constructor(private readonly repository: ProjectRepository) {}

  async execute(userId: string, options: MigrateHeadingsOptions = {}): Promise<HeadingMigrationReport> {
    const { dryRun = false } = options;
    const projects = await this.repository.listProjects(userId);

    const projectResults: ProjectHeadingMigrationResult[] = [];
    let totalChaptersScanned = 0;
    let totalChaptersMigrated = 0;

    for (const project of projects) {
      const chapterResults: ChapterHeadingMigrationResult[] = [];

      for (const chapter of project.getChapters()) {
        totalChaptersScanned++;

        let parsed: unknown;
        try {
          parsed = JSON.parse(chapter.getContent());
        } catch {
          continue;
        }

        const result = ensureChapterTitleHeading(
          parsed as Parameters<typeof ensureChapterTitleHeading>[0],
          chapter.getTitle()
        );

        if (!result.wasAlreadyPresent) {
          totalChaptersMigrated++;
          if (!dryRun) {
            const updated = new Chapter(
              chapter.getId(),
              chapter.getTitle(),
              JSON.stringify(result.content),
              chapter.getOrder()
            );
            await this.repository.updateChapter(userId, project.getId(), updated);
          }
        }

        chapterResults.push({
          chapterId: chapter.getId(),
          chapterTitle: chapter.getTitle(),
          wasAlreadyPresent: result.wasAlreadyPresent,
        });
      }

      if (chapterResults.length > 0) {
        projectResults.push({
          projectId: project.getId(),
          projectTitle: project.getTitle(),
          chapters: chapterResults,
        });
      }
    }

    return {
      projects: projectResults,
      totalChaptersScanned,
      totalChaptersMigrated,
    };
  }
}
