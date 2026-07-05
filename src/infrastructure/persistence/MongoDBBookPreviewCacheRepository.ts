// ABOUTME: MongoDB persistence for the whole-book PDF preview cache: metrics doc + GridFS PDF blob.
// ABOUTME: Keyed {projectId, profileId, ownerId}; GridFS avoids the 16 MB document cap for large books.

import { Collection, Db, GridFSBucket } from 'mongodb';
import type { BookPreviewCacheRepository } from '@/domain/interfaces/BookPreviewCacheRepository';
import {
  BookPreviewCacheEntry,
  type ChapterPageOffset,
} from '@/domain/entities/BookPreviewCacheEntry';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';

const METRICS_COLLECTION = 'book_preview_cache';
const PDF_BUCKET = 'book_preview_pdf';

interface BookPreviewCacheDocument {
  projectId: string;
  profileId: PublicationProfileId;
  ownerId: string;
  contentHash: string;
  frontMatterPageCount: number;
  totalPageCount: number;
  chapterOffsets: ChapterPageOffset[];
  computedAt: Date;
}

export class MongoDBBookPreviewCacheRepository implements BookPreviewCacheRepository {
  private readonly metrics: Collection<BookPreviewCacheDocument>;
  private readonly bucket: GridFSBucket;

  constructor(db: Db) {
    this.metrics = db.collection<BookPreviewCacheDocument>(METRICS_COLLECTION);
    this.bucket = new GridFSBucket(db, { bucketName: PDF_BUCKET });
  }

  async ensureIndexes(): Promise<void> {
    await this.metrics.createIndex(
      { projectId: 1, profileId: 1, ownerId: 1 },
      { name: 'projectId_profileId_ownerId', unique: true },
    );
  }

  async save(entry: BookPreviewCacheEntry, pdf: Buffer): Promise<void> {
    const projectId = entry.getProjectId();
    const profileId = entry.getProfileId();
    const ownerId = entry.getOwnerId();

    await this.metrics.replaceOne(
      { projectId, profileId, ownerId },
      {
        projectId,
        profileId,
        ownerId,
        contentHash: entry.getContentHash(),
        frontMatterPageCount: entry.getFrontMatterPageCount(),
        totalPageCount: entry.getTotalPageCount(),
        chapterOffsets: [...entry.getChapterOffsets()],
        computedAt: entry.getComputedAt(),
      },
      { upsert: true },
    );

    await this.replacePdf(projectId, profileId, ownerId, pdf);
  }

  async loadMetrics(
    projectId: string,
    profileId: PublicationProfileId,
    ownerId: string,
  ): Promise<BookPreviewCacheEntry | null> {
    const doc = await this.metrics.findOne({ projectId, profileId, ownerId });
    if (!doc) return null;

    return BookPreviewCacheEntry.reconstruct({
      projectId: doc.projectId,
      profileId: doc.profileId,
      ownerId: doc.ownerId,
      contentHash: doc.contentHash,
      frontMatterPageCount: doc.frontMatterPageCount,
      totalPageCount: doc.totalPageCount,
      chapterOffsets: doc.chapterOffsets,
      computedAt: doc.computedAt,
    });
  }

  async loadPdf(
    projectId: string,
    profileId: PublicationProfileId,
    ownerId: string,
  ): Promise<Buffer | null> {
    const filename = this.pdfFilename(projectId, profileId, ownerId);
    const files = await this.bucket.find({ filename }).toArray();
    if (files.length === 0) return null;

    const chunks: Buffer[] = [];
    for await (const chunk of this.bucket.openDownloadStreamByName(filename)) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  // GridFS has no upsert; replace = delete existing versions for the key, then upload.
  // Not atomic, but a second concurrent writer only wastes a render (accepted, no corruption).
  private async replacePdf(
    projectId: string,
    profileId: PublicationProfileId,
    ownerId: string,
    pdf: Buffer,
  ): Promise<void> {
    const filename = this.pdfFilename(projectId, profileId, ownerId);
    const existing = await this.bucket.find({ filename }).toArray();
    for (const file of existing) {
      await this.bucket.delete(file._id);
    }

    await new Promise<void>((resolve, reject) => {
      const stream = this.bucket.openUploadStream(filename, {
        metadata: { projectId, profileId, ownerId },
      });
      stream.on('error', reject);
      stream.on('finish', () => resolve());
      stream.end(pdf);
    });
  }

  private pdfFilename(
    projectId: string,
    profileId: PublicationProfileId,
    ownerId: string,
  ): string {
    return `${projectId}::${profileId}::${ownerId}`;
  }
}
