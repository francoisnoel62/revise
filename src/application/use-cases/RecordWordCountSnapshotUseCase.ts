// ABOUTME: Use case for recording a project's total word count for an author-local day
// ABOUTME: Idempotent per day — repeated calls update the same day's snapshot

import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface RecordWordCountSnapshotInput {
  userId: string;
  projectId: string;
  localDate: string;
  totalWords: number;
}

export class RecordWordCountSnapshotUseCase {
  constructor(
    private readonly repository: WordCountSnapshotRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: RecordWordCountSnapshotInput): Promise<WordCountSnapshot> {
    const snapshot = WordCountSnapshot.create(
      this.idGenerator.generate(),
      input.projectId,
      input.userId,
      input.localDate,
      input.totalWords
    );

    return this.repository.upsertForDay(input.userId, snapshot);
  }
}
