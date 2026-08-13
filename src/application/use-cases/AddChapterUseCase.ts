// ABOUTME: Use case for creating and adding new chapters to project
// ABOUTME: Generates unique IDs and assigns sequential order

import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import type { IdGenerator } from '@/domain/interfaces/IdGenerator';

export class AddChapterUseCase {
  constructor(private readonly idGenerator: IdGenerator) {}

  execute(project: Project): Chapter {
    const chapterCount = project.getChapterCount();
    const order = chapterCount;
    const title = `Chapitre ${chapterCount + 1}`;

    // New chapters always start with a titre-de-chapitre H1 so the body never
    // needs a title fallback at preview/export time (fidélité stricte, #143).
    const initialContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
          content: [{ type: 'text', text: title }],
        },
      ],
    });

    const chapter = new Chapter(
      this.idGenerator.generate(),
      title,
      initialContent,
      order
    );

    project.addChapter(chapter);
    return chapter;
  }
}
