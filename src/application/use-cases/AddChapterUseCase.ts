// ABOUTME: Use case for creating and adding new chapters to project
// ABOUTME: Generates unique IDs and assigns sequential order

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

export class AddChapterUseCase {
  execute(project: Project): Chapter {
    const chapterCount = project.getChapterCount();
    const order = chapterCount;
    const title = `Chapitre ${chapterCount + 1}`;

    // Empty TipTap document
    const emptyContent = JSON.stringify({
      type: 'doc',
      content: [],
    });

    const chapter = new Chapter(
      crypto.randomUUID(), // eslint-disable-line no-undef
      title,
      emptyContent,
      order
    );

    project.addChapter(chapter);
    return chapter;
  }
}
