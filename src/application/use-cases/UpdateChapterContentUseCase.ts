// ABOUTME: Use case for updating chapter content
// ABOUTME: Validates TipTap JSON and updates metadata

import { Project } from '@/domain/entities/Project';

export class UpdateChapterContentUseCase {
  execute(project: Project, chapterId: string, content: string): void {
    const chapter = project.getChapter(chapterId);
    if (!chapter) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }

    chapter.updateContent(content);
  }
}
