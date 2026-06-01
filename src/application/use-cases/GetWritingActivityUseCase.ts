// ABOUTME: Use case for building a project's daily writing activity series
// ABOUTME: Derives per-day written deltas from consecutive word count snapshots

import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';

export interface WritingActivityPoint {
  localDate: string;
  total: number;
  /** Words written that day (total minus previous day's total). Null when no predecessor is known. */
  written: number | null;
}

export interface GetWritingActivityInput {
  userId: string;
  projectId: string;
  range?: { fromDate?: string; toDate?: string };
}

export class GetWritingActivityUseCase {
  constructor(private readonly repository: WordCountSnapshotRepository) {}

  async execute(input: GetWritingActivityInput): Promise<WritingActivityPoint[]> {
    const snapshots = await this.repository.findByProjectId(
      input.userId,
      input.projectId,
      input.range
    );

    let previousTotal: number | null = null;
    if (input.range?.fromDate) {
      const baseline = await this.repository.findLatestBefore(
        input.userId,
        input.projectId,
        input.range.fromDate
      );
      previousTotal = baseline ? baseline.getTotalWords() : null;
    }

    return snapshots.map((snapshot) => {
      const total = snapshot.getTotalWords();
      const written = previousTotal === null ? null : total - previousTotal;
      previousTotal = total;
      return { localDate: snapshot.getLocalDate(), total, written };
    });
  }
}
