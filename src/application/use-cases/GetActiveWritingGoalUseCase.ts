// ABOUTME: Use case for getting the active writing goal for a project
// ABOUTME: Returns the most recent 'total' type goal

import { WritingGoal } from '@/domain/entities/WritingGoal';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';

export interface GetActiveWritingGoalInput {
  userId: string;
  projectId: string;
}

export class GetActiveWritingGoalUseCase {
  constructor(private readonly repository: WritingGoalRepository) {}

  async execute(input: GetActiveWritingGoalInput): Promise<WritingGoal | null> {
    return this.repository.findActiveByProjectId(input.userId, input.projectId);
  }
}
