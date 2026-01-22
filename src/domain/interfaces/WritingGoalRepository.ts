// ABOUTME: Repository interface for WritingGoal persistence
// ABOUTME: Defines contract for storing and retrieving writing goals

import { WritingGoal } from '../entities/WritingGoal';

export interface WritingGoalRepository {
  create(userId: string, goal: WritingGoal): Promise<WritingGoal>;
  findById(userId: string, goalId: string): Promise<WritingGoal | null>;
  findByProjectId(userId: string, projectId: string): Promise<WritingGoal[]>;
  findActiveByProjectId(userId: string, projectId: string): Promise<WritingGoal | null>;
  update(userId: string, goal: WritingGoal): Promise<WritingGoal>;
  delete(userId: string, goalId: string): Promise<void>;
  deleteAllByOwner(userId: string): Promise<void>;
}
