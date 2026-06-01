// ABOUTME: WritingQuota entity representing a recurring writing rate for a project
// ABOUTME: Daily or weekly word target, measured against words written within the period

export type QuotaPeriod = 'daily' | 'weekly';

export interface WritingQuotaProperties {
  id: string;
  projectId: string;
  ownerId: string;
  period: QuotaPeriod;
  targetWords: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WritingQuota {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private period: QuotaPeriod;
  private targetWords: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: WritingQuotaProperties) {
    this.validateTargetWords(props.targetWords);

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.period = props.period;
    this.targetWords = props.targetWords;
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
    period: QuotaPeriod,
    targetWords: number
  ): WritingQuota {
    const now = new Date();
    return new WritingQuota({
      id,
      projectId,
      ownerId,
      period,
      targetWords,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: WritingQuotaProperties): WritingQuota {
    return new WritingQuota(props);
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

  getPeriod(): QuotaPeriod {
    return this.period;
  }

  getTargetWords(): number {
    return this.targetWords;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic
  /**
   * Progress toward the period target, as a percentage between 0 and 100.
   * Words written can be negative on a revision-heavy period; progress floors at 0
   * so cutting text is never shown as negative progress.
   */
  getProgress(wordsWrittenInPeriod: number): number {
    const written = Math.max(0, wordsWrittenInPeriod);
    return Math.min(100, (written / this.targetWords) * 100);
  }

  isMet(wordsWrittenInPeriod: number): boolean {
    return wordsWrittenInPeriod >= this.targetWords;
  }

  // Mutations (return new instance)
  updateTarget(newTargetWords: number): WritingQuota {
    this.validateTargetWords(newTargetWords);
    return new WritingQuota({
      ...this.toProperties(),
      targetWords: newTargetWords,
      updatedAt: new Date(),
    });
  }

  updatePeriod(newPeriod: QuotaPeriod): WritingQuota {
    return new WritingQuota({
      ...this.toProperties(),
      period: newPeriod,
      updatedAt: new Date(),
    });
  }

  private toProperties(): WritingQuotaProperties {
    return {
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      period: this.period,
      targetWords: this.targetWords,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
