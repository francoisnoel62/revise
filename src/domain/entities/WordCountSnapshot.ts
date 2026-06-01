// ABOUTME: WordCountSnapshot entity capturing a project's total word count for one author-local day
// ABOUTME: Foundation for daily/weekly writing activity, quotas, and workflow metrics

export interface WordCountSnapshotProperties {
  id: string;
  projectId: string;
  ownerId: string;
  localDate: string;
  totalWords: number;
  createdAt: Date;
  updatedAt: Date;
}

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class WordCountSnapshot {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private readonly localDate: string;
  private totalWords: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: WordCountSnapshotProperties) {
    this.validateLocalDate(props.localDate);
    this.validateTotalWords(props.totalWords);

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.localDate = props.localDate;
    this.totalWords = props.totalWords;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validateLocalDate(localDate: string): void {
    if (!LOCAL_DATE_PATTERN.test(localDate)) {
      throw new Error('Local date must be in YYYY-MM-DD format');
    }

    const [year, month, day] = localDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const isValidCalendarDate =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;

    if (!isValidCalendarDate) {
      throw new Error('Local date must be a valid calendar date');
    }
  }

  private validateTotalWords(totalWords: number): void {
    if (totalWords < 0) {
      throw new Error('Total words cannot be negative');
    }
    if (!Number.isInteger(totalWords)) {
      throw new Error('Total words must be an integer');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    localDate: string,
    totalWords: number
  ): WordCountSnapshot {
    const now = new Date();
    return new WordCountSnapshot({
      id,
      projectId,
      ownerId,
      localDate,
      totalWords,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: WordCountSnapshotProperties): WordCountSnapshot {
    return new WordCountSnapshot(props);
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

  getLocalDate(): string {
    return this.localDate;
  }

  getTotalWords(): number {
    return this.totalWords;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Mutations (return new instance)
  updateTotalWords(newTotalWords: number): WordCountSnapshot {
    this.validateTotalWords(newTotalWords);
    return new WordCountSnapshot({
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      localDate: this.localDate,
      totalWords: newTotalWords,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
