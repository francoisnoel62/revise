// ABOUTME: Use case for switching active chapter with automatic content saving
// ABOUTME: Ensures current chapter content is saved before switching

import { Project } from '@/domain/entities/Project';

export class SwitchChapterUseCase {
  async execute(
    project: Project,
    targetChapterId: string,
    currentContent: string
  ): Promise<void> {
    // Save current chapter content before switching
    const currentChapter = project.getActiveChapter();
    if (currentChapter && currentContent) {
      currentChapter.updateContent(currentContent);
    }

    // Switch to target chapter
    project.setActiveChapter(targetChapterId);
  }
}
