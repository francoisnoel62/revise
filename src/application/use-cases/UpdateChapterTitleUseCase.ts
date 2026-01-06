// ABOUTME: Use case for updating chapter titles
// ABOUTME: Validates title and delegates to Chapter entity

import { Project } from '@/domain/entities/Project';

export class UpdateChapterTitleUseCase {
  execute(project: Project, chapterId: string, title: string): void {
    const chapter = project.getChapter(chapterId);
    if (!chapter) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }

    chapter.updateTitle(title);
  }
}
