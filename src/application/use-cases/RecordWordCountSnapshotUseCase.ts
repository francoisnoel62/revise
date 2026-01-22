// ABOUTME: Use case for recording a daily word count snapshot
// ABOUTME: Creates or updates the snapshot for the current day in Paris timezone

import { WordCountSnapshot } from '@/domain/entities/WordCountSnapshot';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

export interface RecordWordCountSnapshotInput {
  userId: string;
  projectId: string;
  wordCount: number;
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
      input.wordCount
    );

    return this.repository.upsert(input.userId, snapshot);
  }
}
