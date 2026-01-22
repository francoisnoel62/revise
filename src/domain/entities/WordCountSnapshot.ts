// ABOUTME: WordCountSnapshot entity representing a daily word count record for a project
// ABOUTME: Used to track writing progress over time for daily/weekly goal calculations

export interface WordCountSnapshotProperties {
  id: string;
  projectId: string;
  ownerId: string;
  date: Date;
  wordCount: number;
  createdAt: Date;
}

/**
 * Normalizes a date to midnight in Europe/Paris timezone
 */
export function normalizeToParisDate(date: Date): Date {
  const parisFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parisDateStr = parisFormatter.format(date);
  // Parse as UTC midnight for storage consistency
  return new Date(parisDateStr + 'T00:00:00.000Z');
}

/**
 * Gets the start of the current week (Monday) in Paris timezone
 */
export function getWeekStartParis(date: Date): Date {
  const normalized = normalizeToParisDate(date);
  const dayOfWeek = normalized.getUTCDay();
  // Convert Sunday (0) to 7 for easier Monday-based calculation
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(normalized);
  monday.setUTCDate(monday.getUTCDate() - daysFromMonday);
  return monday;
}

/**
 * Gets yesterday's date in Paris timezone
 */
export function getYesterdayParis(date: Date): Date {
  const normalized = normalizeToParisDate(date);
  const yesterday = new Date(normalized);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday;
}

export class WordCountSnapshot {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private readonly date: Date;
  private readonly wordCount: number;
  private readonly createdAt: Date;

  private constructor(props: WordCountSnapshotProperties) {
    this.validateWordCount(props.wordCount);

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.date = props.date;
    this.wordCount = props.wordCount;
    this.createdAt = props.createdAt;
  }

  private validateWordCount(wordCount: number): void {
    if (wordCount < 0) {
      throw new Error('Word count cannot be negative');
    }
    if (!Number.isInteger(wordCount)) {
      throw new Error('Word count must be an integer');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    wordCount: number,
    date?: Date
  ): WordCountSnapshot {
    const now = new Date();
    const normalizedDate = normalizeToParisDate(date ?? now);

    return new WordCountSnapshot({
      id,
      projectId,
      ownerId,
      date: normalizedDate,
      wordCount,
      createdAt: now,
    });
  }

  static reconstruct(props: WordCountSnapshotProperties): WordCountSnapshot {
    return new WordCountSnapshot(props);
  }

  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getDate(): Date {
    return this.date;
  }

  getWordCount(): number {
    return this.wordCount;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Creates a new snapshot with updated word count (immutable update)
   */
  updateWordCount(newWordCount: number): WordCountSnapshot {
    return new WordCountSnapshot({
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      date: this.date,
      wordCount: newWordCount,
      createdAt: this.createdAt,
    });
  }
}
