// ABOUTME: Repository interface for persisting incremental extraction state (per-chapter content hashes)
// ABOUTME: Separated from CanonFactRepository to keep infrastructure concerns out of the facts ledger

export interface CanonExtractionStateRepository {
  /** Return the per-chapter content hashes stored from the last extraction run. */
  getChapterHashes(ownerId: string, projectId: string): Promise<Map<string, string>>;

  /** Persist per-chapter content hashes after an extraction run. */
  saveChapterHashes(ownerId: string, projectId: string, hashes: Map<string, string>): Promise<void>;
}
