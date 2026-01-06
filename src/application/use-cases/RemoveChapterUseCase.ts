// ABOUTME: Use case for removing chapters from project
// ABOUTME: Handles active chapter reassignment after deletion

import { Project } from '@/domain/entities/Project';

export class RemoveChapterUseCase {
  execute(project: Project, chapterId: string): void {
    if (project.getChapterCount() === 1) {
      throw new Error('Cannot remove the last chapter');
    }

    project.removeChapter(chapterId);
  }
}
