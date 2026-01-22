// ABOUTME: Vercel Blob implementation of BlobStorage interface
// ABOUTME: Provides file upload, deletion, and existence check via Vercel Blob

import { put, del, head } from '@vercel/blob';
import { BlobStorage, BlobStorageOptions, UploadResult } from '@/domain/interfaces/BlobStorage';

export class VercelBlobStorage implements BlobStorage {
  private readonly pathPrefix: string;

  constructor(pathPrefix: string = 'covers') {
    this.pathPrefix = pathPrefix;
  }

  async upload(
    file: ArrayBuffer | Blob,
    filename: string,
    contentType: string,
    options?: BlobStorageOptions
  ): Promise<UploadResult> {
    const fileSize = file instanceof Blob ? file.size : file.byteLength;

    if (options?.maxSize && fileSize > options.maxSize) {
      throw new Error('File size exceeds maximum allowed size');
    }

    if (options?.allowedContentTypes && !options.allowedContentTypes.includes(contentType)) {
      throw new Error('Content type not allowed');
    }

    const pathname = `${this.pathPrefix}/${filename}`;

    const result = await put(pathname, file, {
      access: 'public',
      contentType,
    });

    return {
      url: result.url,
      pathname: result.pathname,
      contentType: result.contentType,
      size: fileSize,
    };
  }

  async delete(url: string): Promise<void> {
    await del(url);
  }

  async exists(url: string): Promise<boolean> {
    try {
      await head(url);
      return true;
    } catch {
      return false;
    }
  }
}
