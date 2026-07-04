// ABOUTME: Integration tests for MongoDBBookPreviewCacheRepository against a real MongoDB + GridFS.
// ABOUTME: Verifies idempotent upsert, PDF round-trip via GridFS, owner isolation, and null misses.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { GridFSBucket, type Db } from 'mongodb';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBBookPreviewCacheRepository } from './MongoDBBookPreviewCacheRepository';
import { BookPreviewCacheEntry } from '@/domain/entities/BookPreviewCacheEntry';

const METRICS_COLLECTION = 'book_preview_cache';
const PDF_BUCKET = 'book_preview_pdf';

function buildEntry(ownerId: string, projectId = 'proj-1'): BookPreviewCacheEntry {
  return BookPreviewCacheEntry.create(
    {
      projectId,
      profileId: 'kdp-6x9',
      ownerId,
      contentHash: 'hash-1',
      frontMatterPageCount: 4,
      totalPageCount: 120,
      chapterOffsets: [
        { chapterId: 'ch-1', pageNumber: 5 },
        { chapterId: 'ch-2', pageNumber: 40 },
      ],
    },
    new Date('2026-07-05T10:00:00Z'),
  );
}

describe('MongoDBBookPreviewCacheRepository — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let repository: MongoDBBookPreviewCacheRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    repository = new MongoDBBookPreviewCacheRepository(db);
    await repository.ensureIndexes();
  });

  afterEach(async () => {
    await db.collection(METRICS_COLLECTION).deleteMany({ ownerId });
    const bucket = new GridFSBucket(db, { bucketName: PDF_BUCKET });
    const files = await bucket.find({ 'metadata.ownerId': ownerId }).toArray();
    for (const f of files) await bucket.delete(f._id);
  });

  it('saves metrics + PDF and reads both back', async () => {
    const pdf = Buffer.from('%PDF-1.7 fake pdf bytes');
    await repository.save(buildEntry(ownerId), pdf);

    const metrics = await repository.loadMetrics('proj-1', 'kdp-6x9', ownerId);
    expect(metrics).not.toBeNull();
    expect(metrics!.getContentHash()).toBe('hash-1');
    expect(metrics!.getTotalPageCount()).toBe(120);
    expect(metrics!.pageForChapter('ch-2')).toBe(40);

    const loadedPdf = await repository.loadPdf('proj-1', 'kdp-6x9', ownerId);
    expect(loadedPdf).not.toBeNull();
    expect(loadedPdf!.equals(pdf)).toBe(true);
  });

  it('returns null for metrics and PDF when nothing is cached', async () => {
    expect(await repository.loadMetrics('proj-absent', 'kdp-6x9', ownerId)).toBeNull();
    expect(await repository.loadPdf('proj-absent', 'kdp-6x9', ownerId)).toBeNull();
  });

  it('upsert is idempotent: a second save replaces rather than duplicates', async () => {
    await repository.save(buildEntry(ownerId), Buffer.from('first'));
    await repository.save(buildEntry(ownerId), Buffer.from('second-newer'));

    const metricsDocs = await db
      .collection(METRICS_COLLECTION)
      .countDocuments({ projectId: 'proj-1', profileId: 'kdp-6x9', ownerId });
    expect(metricsDocs).toBe(1);

    const bucket = new GridFSBucket(db, { bucketName: PDF_BUCKET });
    const files = await bucket
      .find({ filename: `proj-1::kdp-6x9::${ownerId}` })
      .toArray();
    expect(files).toHaveLength(1);

    const loadedPdf = await repository.loadPdf('proj-1', 'kdp-6x9', ownerId);
    expect(loadedPdf!.toString()).toBe('second-newer');
  });

  it('isolates cache entries by owner', async () => {
    const otherOwner = `test-integration-${randomUUID()}`;
    await repository.save(buildEntry(ownerId), Buffer.from('mine'));

    const foreign = await repository.loadMetrics('proj-1', 'kdp-6x9', otherOwner);
    expect(foreign).toBeNull();
    expect(await repository.loadPdf('proj-1', 'kdp-6x9', otherOwner)).toBeNull();

    // cleanup any stray docs for the other owner (defensive; none expected)
    await db.collection(METRICS_COLLECTION).deleteMany({ ownerId: otherOwner });
  });
});
