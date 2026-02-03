// ABOUTME: MongoDB implementation of AnalysisRepository with multi-tenant support.
// ABOUTME: Manages chapter analyses, history, ignored issues, and repetition exclusions.

import { Db, Collection } from 'mongodb';
import {
  AnalysisRepository,
  IgnoredIssue,
  RepetitionExclusionRecord,
} from '@/domain/interfaces/AnalysisRepository';
import { ChapterAnalysis } from '@/domain/entities/ChapterAnalysis';
import { AnalysisHistory } from '@/domain/entities/AnalysisHistory';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import {
  ChapterAnalysisDocument,
  serializeChapterAnalysis,
  deserializeChapterAnalysis,
} from './serialization/chapter-analysis-serializer';
import {
  AnalysisHistoryDocument,
  serializeAnalysisHistory,
  deserializeAnalysisHistory,
} from './serialization/analysis-history-serializer';

/**
 * MongoDB document shape for IgnoredIssue.
 */
interface IgnoredIssueDocument {
  _id: string;
  chapterId: string;
  ownerId: string;
  originalText: string;
  category: AnalysisCategory;
  ignoredAt: Date;
}

/**
 * MongoDB document shape for RepetitionExclusion.
 */
interface RepetitionExclusionDocument {
  _id: string;
  projectId: string;
  ownerId: string;
  word: string;
  reason?: string;
  createdAt: Date;
}

/**
 * MongoDB implementation of AnalysisRepository.
 * Enforces multi-tenant isolation via ownerId filtering on all queries.
 */
export class MongoDBAnalysisRepository implements AnalysisRepository {
  private analysisCollection: Collection<ChapterAnalysisDocument>;
  private historyCollection: Collection<AnalysisHistoryDocument>;
  private ignoredCollection: Collection<IgnoredIssueDocument>;
  private exclusionsCollection: Collection<RepetitionExclusionDocument>;

  constructor(db: Db) {
    this.analysisCollection = db.collection<ChapterAnalysisDocument>('chapter_analyses');
    this.historyCollection = db.collection<AnalysisHistoryDocument>('analysis_history');
    this.ignoredCollection = db.collection<IgnoredIssueDocument>('ignored_issues');
    this.exclusionsCollection = db.collection<RepetitionExclusionDocument>('repetition_exclusions');
  }

  /**
   * Ensure indexes exist for efficient queries.
   */
  async ensureIndexes(): Promise<void> {
    // Analysis indexes
    await this.analysisCollection.createIndex(
      { chapterId: 1, ownerId: 1 },
      { name: 'chapterId_ownerId' }
    );
    await this.analysisCollection.createIndex(
      { chapterId: 1, ownerId: 1, contentHash: 1 },
      { name: 'chapterId_ownerId_contentHash' }
    );

    // History indexes
    await this.historyCollection.createIndex(
      { chapterId: 1, ownerId: 1, createdAt: -1 },
      { name: 'chapterId_ownerId_createdAt' }
    );

    // Ignored issues indexes
    await this.ignoredCollection.createIndex(
      { chapterId: 1, ownerId: 1 },
      { name: 'chapterId_ownerId' }
    );
    await this.ignoredCollection.createIndex(
      { chapterId: 1, ownerId: 1, originalText: 1, category: 1 },
      { name: 'chapterId_ownerId_text_category', unique: true }
    );

    // Exclusions indexes
    await this.exclusionsCollection.createIndex(
      { projectId: 1, ownerId: 1 },
      { name: 'projectId_ownerId' }
    );
    await this.exclusionsCollection.createIndex(
      { projectId: 1, ownerId: 1, word: 1 },
      { name: 'projectId_ownerId_word', unique: true }
    );
  }

  // ============================================================
  // ChapterAnalysis operations
  // ============================================================

  async saveAnalysis(ownerId: string, analysis: ChapterAnalysis): Promise<void> {
    const doc = serializeChapterAnalysis(analysis, ownerId);
    await this.analysisCollection.insertOne(doc);
  }

  async findAnalysisByChapterId(
    ownerId: string,
    chapterId: string
  ): Promise<ChapterAnalysis | null> {
    const doc = await this.analysisCollection.findOne(
      { chapterId, ownerId },
      { sort: { analyzedAt: -1 } }
    );

    if (!doc) return null;
    return deserializeChapterAnalysis(doc);
  }

  async findAnalysisByContentHash(
    ownerId: string,
    chapterId: string,
    contentHash: string
  ): Promise<ChapterAnalysis | null> {
    const doc = await this.analysisCollection.findOne({
      chapterId,
      ownerId,
      contentHash,
    });

    if (!doc) return null;
    return deserializeChapterAnalysis(doc);
  }

  async updateAnalysis(ownerId: string, analysis: ChapterAnalysis): Promise<void> {
    const doc = serializeChapterAnalysis(analysis, ownerId);
    await this.analysisCollection.replaceOne(
      { _id: analysis.getId(), ownerId },
      doc
    );
  }

  async deleteAnalysis(ownerId: string, analysisId: string): Promise<void> {
    await this.analysisCollection.deleteOne({ _id: analysisId, ownerId });
  }

  // ============================================================
  // AnalysisHistory operations
  // ============================================================

  async saveHistory(ownerId: string, history: AnalysisHistory): Promise<void> {
    const doc = serializeAnalysisHistory(history, ownerId);
    await this.historyCollection.insertOne(doc);
  }

  async findHistoryByChapterId(
    ownerId: string,
    chapterId: string
  ): Promise<AnalysisHistory[]> {
    const docs = await this.historyCollection
      .find({ chapterId, ownerId })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(deserializeAnalysisHistory);
  }

  async findHistoryById(
    ownerId: string,
    historyId: string
  ): Promise<AnalysisHistory | null> {
    const doc = await this.historyCollection.findOne({
      _id: historyId,
      ownerId,
    });

    if (!doc) return null;
    return deserializeAnalysisHistory(doc);
  }

  async updateHistory(ownerId: string, history: AnalysisHistory): Promise<void> {
    const doc = serializeAnalysisHistory(history, ownerId);
    await this.historyCollection.replaceOne(
      { _id: history.getId(), ownerId },
      doc
    );
  }

  // ============================================================
  // Ignored issues operations
  // ============================================================

  async saveIgnoredIssue(
    ownerId: string,
    chapterId: string,
    originalText: string,
    category: AnalysisCategory
  ): Promise<void> {
    const doc: IgnoredIssueDocument = {
      _id: `${chapterId}-${originalText}-${category}`,
      chapterId,
      ownerId,
      originalText,
      category,
      ignoredAt: new Date(),
    };

    await this.ignoredCollection.updateOne(
      { _id: doc._id },
      { $set: doc },
      { upsert: true }
    );
  }

  async findIgnoredIssues(ownerId: string, chapterId: string): Promise<IgnoredIssue[]> {
    const docs = await this.ignoredCollection
      .find({ chapterId, ownerId })
      .toArray();

    return docs.map((doc) => ({
      id: doc._id,
      chapterId: doc.chapterId,
      ownerId: doc.ownerId,
      originalText: doc.originalText,
      category: doc.category,
      ignoredAt: new Date(doc.ignoredAt),
    }));
  }

  async removeIgnoredIssue(
    ownerId: string,
    chapterId: string,
    originalText: string,
    category: AnalysisCategory
  ): Promise<void> {
    await this.ignoredCollection.deleteOne({
      chapterId,
      ownerId,
      originalText,
      category,
    });
  }

  // ============================================================
  // Repetition exclusions operations
  // ============================================================

  async saveRepetitionExclusion(
    ownerId: string,
    projectId: string,
    word: string,
    reason?: string
  ): Promise<void> {
    const normalizedWord = word.toLowerCase();
    const doc: RepetitionExclusionDocument = {
      _id: `${projectId}-${normalizedWord}`,
      projectId,
      ownerId,
      word: normalizedWord,
      reason,
      createdAt: new Date(),
    };

    await this.exclusionsCollection.updateOne(
      { _id: doc._id },
      { $set: doc },
      { upsert: true }
    );
  }

  async findRepetitionExclusions(
    ownerId: string,
    projectId: string
  ): Promise<RepetitionExclusionRecord[]> {
    const docs = await this.exclusionsCollection
      .find({ projectId, ownerId })
      .toArray();

    return docs.map((doc) => ({
      id: doc._id,
      projectId: doc.projectId,
      ownerId: doc.ownerId,
      word: doc.word,
      reason: doc.reason,
      createdAt: new Date(doc.createdAt),
    }));
  }

  async removeRepetitionExclusion(
    ownerId: string,
    projectId: string,
    word: string
  ): Promise<void> {
    const normalizedWord = word.toLowerCase();
    await this.exclusionsCollection.deleteOne({
      projectId,
      ownerId,
      word: normalizedWord,
    });
  }

  // ============================================================
  // Cleanup operations
  // ============================================================

  async deleteAllByChapterId(ownerId: string, chapterId: string): Promise<void> {
    await Promise.all([
      this.analysisCollection.deleteMany({ chapterId, ownerId }),
      this.historyCollection.deleteMany({ chapterId, ownerId }),
      this.ignoredCollection.deleteMany({ chapterId, ownerId }),
    ]);
  }

  async deleteAllByProjectId(ownerId: string, projectId: string): Promise<void> {
    await Promise.all([
      this.analysisCollection.deleteMany({ projectId, ownerId }),
      this.historyCollection.deleteMany({ projectId, ownerId }),
      this.exclusionsCollection.deleteMany({ projectId, ownerId }),
    ]);
  }

  async deleteAllByOwner(ownerId: string): Promise<number> {
    const results = await Promise.all([
      this.analysisCollection.deleteMany({ ownerId }),
      this.historyCollection.deleteMany({ ownerId }),
      this.ignoredCollection.deleteMany({ ownerId }),
      this.exclusionsCollection.deleteMany({ ownerId }),
    ]);

    return results.reduce((sum, r) => sum + r.deletedCount, 0);
  }
}
