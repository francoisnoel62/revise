// ABOUTME: Use case for recording a project's total word count for an author-local day
// ABOUTME: Idempotent per day — repeated calls update the same day's snapshot

import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { getWeekStartLocalDate, previousLocalDate } from '@/lib/workflow-metrics';

export interface RecordWordCountSnapshotInput {
  userId: string;
  projectId: string;
  localDate: string;
  totalWords: number;
  /**
   * The project's total before this save. When provided and the project has no
   * earlier snapshot, a baseline snapshot is seeded before the current week so
   * pre-existing words are not counted as written today/this week.
   */
  previousTotalWords?: number;
}

export class RecordWordCountSnapshotUseCase {
  constructor(
    private readonly repository: WordCountSnapshotRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: RecordWordCountSnapshotInput): Promise<WordCountSnapshot> {
    if (input.previousTotalWords !== undefined) {
      await this.seedBaselineIfNeeded(input);
    }

    const snapshot = WordCountSnapshot.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.localDate,
      input.totalWords
    );

    return this.repository.upsertForDay(input.userId, snapshot);
  }

  /**
   * When a project has no snapshot before today, record where it started so
   * pre-existing words are not mistaken for words written in the current period.
   * The baseline is dated to the day before the current week's Monday so it
   * predates both "today" and "this week".
   */
  private async seedBaselineIfNeeded(input: RecordWordCountSnapshotInput): Promise<void> {
    const earlier = await this.repository.findLatestBefore(
      input.userId,
      input.projectId,
      input.localDate
    );
    if (earlier !== null) return;

    const seedDate = previousLocalDate(getWeekStartLocalDate(input.localDate));
    const baseline = WordCountSnapshot.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      seedDate,
      input.previousTotalWords!
    );
    await this.repository.upsertForDay(input.userId, baseline);
  }
}
