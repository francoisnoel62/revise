// ABOUTME: Use case for listing writing goals for a project
// ABOUTME: Returns all goals sorted by creation date

import { WritingGoal } from '@/domain/entities/WritingGoal';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';

export interface ListWritingGoalsInput {
  userId: string;
  projectId: string;
}

export class ListWritingGoalsUseCase {
  constructor(private readonly repository: WritingGoalRepository) {}

  async execute(input: ListWritingGoalsInput): Promise<WritingGoal[]> {
    return this.repository.findByProjectId(input.userId, input.projectId);
  }
}
