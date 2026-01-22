// ABOUTME: Use case for deleting a writing goal
// ABOUTME: Validates ownership before deletion

import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';

export interface DeleteWritingGoalInput {
  userId: string;
  goalId: string;
}

export class DeleteWritingGoalUseCase {
  constructor(private readonly repository: WritingGoalRepository) {}

  async execute(input: DeleteWritingGoalInput): Promise<void> {
    await this.repository.delete(input.userId, input.goalId);
  }
}
