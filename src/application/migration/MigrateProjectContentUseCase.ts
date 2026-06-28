// ABOUTME: Orchestrates semantic content migration for all chapters of a given user.
// ABOUTME: Idempotent — chapters already migrated are skipped; dry-run mode skips writes.

import { Chapter } from '@/domain/entities/Chapter';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { migrateContent, type MigrationAmbiguity } from './ContentMigrator';

export interface ChapterMigrationResult {
  chapterId: string;
  chapterTitle: string;
  wasAlreadyMigrated: boolean;
  ambiguities: MigrationAmbiguity[];
}

export interface ProjectMigrationResult {
  projectId: string;
  projectTitle: string;
  chapters: ChapterMigrationResult[];
}

export interface MigrationReport {
  projects: ProjectMigrationResult[];
  totalChaptersScanned: number;
  totalChaptersMigrated: number;
  totalAmbiguities: number;
}

export interface MigrateOptions {
  dryRun?: boolean;
}

export class MigrateProjectContentUseCase {
  constructor(private readonly repository: ProjectRepository) {}

  async execute(userId: string, options: MigrateOptions = {}): Promise<MigrationReport> {
    const { dryRun = false } = options;
    const projects = await this.repository.listProjects(userId);

    const projectResults: ProjectMigrationResult[] = [];
    let totalChaptersScanned = 0;
    let totalChaptersMigrated = 0;
    let totalAmbiguities = 0;

    for (const project of projects) {
      const chapterResults: ChapterMigrationResult[] = [];

      for (const chapter of project.getChapters()) {
        totalChaptersScanned++;

        let parsed: unknown;
        try {
          parsed = JSON.parse(chapter.getContent());
        } catch {
          continue;
        }

        const result = migrateContent(parsed as Parameters<typeof migrateContent>[0]);

        if (!result.wasAlreadyMigrated) {
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

        totalAmbiguities += result.ambiguities.length;
        chapterResults.push({
          chapterId: chapter.getId(),
          chapterTitle: chapter.getTitle(),
          wasAlreadyMigrated: result.wasAlreadyMigrated,
          ambiguities: result.ambiguities,
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
      totalAmbiguities,
    };
  }
}
