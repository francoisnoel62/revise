// ABOUTME: Interface for blob storage operations (e.g., image uploads)
// ABOUTME: Abstracts storage provider (Vercel Blob, S3, etc.)

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export interface BlobStorageOptions {
  /**
   * Maximum file size in bytes.
   */
  maxSize?: number;

  /**
   * Allowed content types.
   */
  allowedContentTypes?: string[];

  /**
   * Suggested aspect ratio for validation (width/height).
   * E.g., 2/3 for book covers.
   */
  suggestedAspectRatio?: number;

  /**
   * Tolerance for aspect ratio validation.
   * Default: 0.1 (10%)
   */
  aspectRatioTolerance?: number;
}

export interface BlobStorage {
  /**
   * Upload a file to blob storage.
   * @param file - File to upload (as ArrayBuffer or Blob)
   * @param filename - Original filename
   * @param contentType - MIME type of the file
   * @param options - Upload options for validation
   * @returns Upload result with URL and metadata
   */
  upload(
    file: ArrayBuffer | Blob,
    filename: string,
    contentType: string,
    options?: BlobStorageOptions
  ): Promise<UploadResult>;

  /**
   * Delete a file from blob storage.
   * @param url - URL of the file to delete
   */
  delete(url: string): Promise<void>;

  /**
   * Check if a file exists in blob storage.
   * @param url - URL of the file to check
   * @returns true if the file exists
   */
  exists(url: string): Promise<boolean>;
}
