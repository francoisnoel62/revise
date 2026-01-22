// ABOUTME: Tests for VercelBlobStorage
// ABOUTME: Verifies blob upload, delete, and validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelBlobStorage } from '../VercelBlobStorage';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  del: vi.fn(),
  head: vi.fn(),
}));

import { put, del, head } from '@vercel/blob';

describe('VercelBlobStorage', () => {
  let storage: VercelBlobStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new VercelBlobStorage();
  });

  describe('upload', () => {
    it('uploads file successfully', async () => {
      const mockResult = {
        url: 'https://blob.vercel-storage.com/covers/test.jpg',
        pathname: 'covers/test.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      };

      vi.mocked(put).mockResolvedValue(mockResult as any);

      const file = new ArrayBuffer(1024);
      const result = await storage.upload(file, 'test.jpg', 'image/jpeg');

      expect(result.url).toBe(mockResult.url);
      expect(result.pathname).toBe(mockResult.pathname);
      expect(result.contentType).toBe(mockResult.contentType);
      expect(result.size).toBe(mockResult.size);
      expect(put).toHaveBeenCalledWith('covers/test.jpg', file, {
        access: 'public',
        contentType: 'image/jpeg',
      });
    });

    it('throws error when file exceeds max size', async () => {
      const file = new ArrayBuffer(10 * 1024 * 1024); // 10MB

      await expect(
        storage.upload(file, 'test.jpg', 'image/jpeg', { maxSize: 5 * 1024 * 1024 })
      ).rejects.toThrow('File size exceeds maximum allowed size');
    });

    it('throws error when content type not allowed', async () => {
      const file = new ArrayBuffer(1024);

      await expect(
        storage.upload(file, 'test.gif', 'image/gif', {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        })
      ).rejects.toThrow('Content type not allowed');
    });

    it('allows valid content types', async () => {
      vi.mocked(put).mockResolvedValue({
        url: 'https://blob.vercel-storage.com/covers/test.png',
        pathname: 'covers/test.png',
        contentType: 'image/png',
        size: 1024,
      } as any);

      const file = new ArrayBuffer(1024);

      await expect(
        storage.upload(file, 'test.png', 'image/png', {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        })
      ).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes file successfully', async () => {
      vi.mocked(del).mockResolvedValue(undefined);

      await expect(
        storage.delete('https://blob.vercel-storage.com/covers/test.jpg')
      ).resolves.not.toThrow();

      expect(del).toHaveBeenCalledWith('https://blob.vercel-storage.com/covers/test.jpg');
    });
  });

  describe('exists', () => {
    it('returns true when file exists', async () => {
      vi.mocked(head).mockResolvedValue({
        url: 'https://blob.vercel-storage.com/covers/test.jpg',
        pathname: 'covers/test.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      } as any);

      const result = await storage.exists('https://blob.vercel-storage.com/covers/test.jpg');

      expect(result).toBe(true);
    });

    it('returns false when file does not exist', async () => {
      vi.mocked(head).mockRejectedValue(new Error('Not found'));

      const result = await storage.exists('https://blob.vercel-storage.com/covers/nonexistent.jpg');

      expect(result).toBe(false);
    });
  });
});
