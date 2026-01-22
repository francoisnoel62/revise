// ABOUTME: Use case for updating a writing goal
// ABOUTME: Supports updating target, deadline, and type

import { WritingGoal, GoalType } from '@/domain/entities/WritingGoal';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';

export interface UpdateWritingGoalInput {
  userId: string;
  goalId: string;
  targetWords?: number;
  deadline?: Date | null;
  type?: GoalType;
}

export class UpdateWritingGoalUseCase {
  constructor(private readonly repository: WritingGoalRepository) {}

  async execute(input: UpdateWritingGoalInput): Promise<WritingGoal> {
    const existing = await this.repository.findById(input.userId, input.goalId);

    if (!existing) {
      throw new Error('Goal not found');
    }

    let updated = existing;

    if (input.targetWords !== undefined) {
      updated = updated.updateTarget(input.targetWords);
    }

    if (input.deadline !== undefined) {
      updated = updated.updateDeadline(input.deadline);
    }

    if (input.type !== undefined) {
      updated = updated.updateType(input.type);
    }

    return this.repository.update(input.userId, updated);
  }
}
