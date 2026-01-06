// ABOUTME: Use case for reordering chapters via drag and drop
// ABOUTME: Delegates to Project aggregate for order management

import { Project } from '@/domain/entities/Project';

export class ReorderChaptersUseCase {
  execute(project: Project, fromIndex: number, toIndex: number): void {
    project.reorderChapters(fromIndex, toIndex);
  }
}
