// ABOUTME: Use case for creating a new writing goal
// ABOUTME: Validates input and delegates to repository

import { WritingGoal, GoalType } from '@/domain/entities/WritingGoal';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface CreateWritingGoalInput {
  userId: string;
  projectId: string;
  type: GoalType;
  targetWords: number;
  deadline?: Date;
}

export class CreateWritingGoalUseCase {
  constructor(
    private readonly repository: WritingGoalRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateWritingGoalInput): Promise<WritingGoal> {
    const goal = WritingGoal.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.type,
      input.targetWords,
      input.deadline
    );

    return this.repository.create(input.userId, goal);
  }
}
