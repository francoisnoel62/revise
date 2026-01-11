// ABOUTME: Tests for main Server Actions (import/export/rewrite).
// ABOUTME: Validates Clean Architecture compliance with dependency injection.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importDocument } from './actions';

// Mock the utils module
vi.mock('./actions/utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getRepository: vi.fn(),
  getDocumentParser: vi.fn(),
  getAnyAvailableLLMProvider: vi.fn().mockResolvedValue(undefined), // No LLM for tests
  withErrorHandling: vi.fn(async (fn) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

import {
  getAuthenticatedUserId,
  getRepository,
  getDocumentParser,
} from './actions/utils';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';
import { Chapter } from '@/domain/entities/Chapter';

/**
 * Creates a mock File object with arrayBuffer support for testing.
 * jsdom doesn't fully support File.arrayBuffer(), so we need this helper.
 */
function createMockFile(content: string, filename: string, type: string): File {
  const blob = new Blob([content], { type });
  const file = new File([blob], filename, { type });
  // Add arrayBuffer method if not present (jsdom compatibility)
  if (!file.arrayBuffer) {
    (file as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = async () => {
      return new TextEncoder().encode(content).buffer;
    };
  }
  return file;
}

describe('importDocument', () => {
  let mockRepository: InMemoryProjectRepository;
  let mockParser: {
    supports: ReturnType<typeof vi.fn>;
    parseToChapters: ReturnType<typeof vi.fn>;
    parse: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new InMemoryProjectRepository();
    vi.mocked(getRepository).mockResolvedValue(mockRepository);

    // Create mock parser
    mockParser = {
      supports: vi.fn().mockReturnValue(true),
      parseToChapters: vi.fn().mockResolvedValue([
        new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0),
        new Chapter('ch-2', '', '{"type":"doc","content":[]}', 1), // Empty title to test auto-naming
      ]),
      parse: vi.fn().mockResolvedValue('content'),
    };
    vi.mocked(getDocumentParser).mockResolvedValue(mockParser);
  });

  it('uses getDocumentParser for dependency injection', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    const formData = new FormData();
    const file = createMockFile(
      'test content',
      'test.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    formData.append('file', file);

    await importDocument(formData);

    // Verify getDocumentParser was called (DI pattern)
    expect(getDocumentParser).toHaveBeenCalled();
  });

  it('delegates parsing to the injected parser', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    const formData = new FormData();
    const file = createMockFile(
      'test content',
      'my-novel.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    formData.append('file', file);

    await importDocument(formData);

    // Verify parser.parseToChapters was called
    expect(mockParser.parseToChapters).toHaveBeenCalled();
  });

  it('creates project with title extracted from filename', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    const formData = new FormData();
    const file = createMockFile(
      'test content',
      'my-novel.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    formData.append('file', file);

    const result = await importDocument(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('my-novel');
    }
  });

  it('auto-names chapters without titles', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    const formData = new FormData();
    const file = createMockFile(
      'test content',
      'test.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    formData.append('file', file);

    const result = await importDocument(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      // Second chapter should be auto-named
      expect(result.data.chapters[1].title).toBe('Chapitre 2');
    }
  });

  it('persists project to repository', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    const formData = new FormData();
    const file = createMockFile(
      'test content',
      'test.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    formData.append('file', file);

    const result = await importDocument(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      // Verify project was persisted
      const loaded = await mockRepository.loadProject('user-123', result.data.id);
      expect(loaded).not.toBeNull();
      expect(loaded?.getTitle()).toBe('test');
    }
  });

  it('returns error for unauthenticated user', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
    });

    const formData = new FormData();
    const file = createMockFile(
      'test content',
      'test.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    formData.append('file', file);

    const result = await importDocument(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.redirect).toBe('/auth/signin');
    }
  });

  it('returns error when no file provided', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

    const formData = new FormData();
    // No file added

    const result = await importDocument(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('No file provided');
    }
  });

  it('returns error for unsupported file format', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
    mockParser.supports.mockReturnValue(false);

    const formData = new FormData();
    const file = createMockFile('test content', 'test.pdf', 'application/pdf');
    formData.append('file', file);

    const result = await importDocument(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unsupported');
    }
  });
});
