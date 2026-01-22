// ABOUTME: WritingGoal entity representing a word count objective for a project
// ABOUTME: Supports daily, weekly, and total project goal types with deadline tracking

export type GoalType = 'daily' | 'weekly' | 'total';

export interface WritingGoalProperties {
  id: string;
  projectId: string;
  ownerId: string;
  type: GoalType;
  targetWords: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class WritingGoal {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private type: GoalType;
  private targetWords: number;
  private deadline: Date | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: WritingGoalProperties) {
    this.validateTargetWords(props.targetWords);

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.type = props.type;
    this.targetWords = props.targetWords;
    this.deadline = props.deadline ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validateTargetWords(targetWords: number): void {
    if (targetWords <= 0) {
      throw new Error('Target words must be greater than 0');
    }
    if (!Number.isInteger(targetWords)) {
      throw new Error('Target words must be an integer');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    type: GoalType,
    targetWords: number,
    deadline?: Date
  ): WritingGoal {
    const now = new Date();
    return new WritingGoal({
      id,
      projectId,
      ownerId,
      type,
      targetWords,
      deadline,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: WritingGoalProperties): WritingGoal {
    return new WritingGoal(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getType(): GoalType {
    return this.type;
  }

  getTargetWords(): number {
    return this.targetWords;
  }

  getDeadline(): Date | null {
    return this.deadline;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic
  getProgress(currentWordCount: number): number {
    if (this.targetWords === 0) return 0;
    return Math.min(100, (currentWordCount / this.targetWords) * 100);
  }

  isCompleted(currentWordCount: number): boolean {
    return currentWordCount >= this.targetWords;
  }

  isOverdue(): boolean {
    if (!this.deadline) return false;
    return new Date() > this.deadline;
  }

  getRemainingWords(currentWordCount: number): number {
    return Math.max(0, this.targetWords - currentWordCount);
  }

  getDaysRemaining(): number | null {
    if (!this.deadline) return null;
    const now = new Date();
    const diffTime = this.deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Mutations (return new instance)
  updateTarget(newTargetWords: number): WritingGoal {
    this.validateTargetWords(newTargetWords);
    return new WritingGoal({
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      type: this.type,
      targetWords: newTargetWords,
      deadline: this.deadline ?? undefined,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  updateDeadline(newDeadline: Date | null): WritingGoal {
    return new WritingGoal({
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      type: this.type,
      targetWords: this.targetWords,
      deadline: newDeadline ?? undefined,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  updateType(newType: GoalType): WritingGoal {
    return new WritingGoal({
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      type: newType,
      targetWords: this.targetWords,
      deadline: this.deadline ?? undefined,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
