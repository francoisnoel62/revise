// ABOUTME: Tests for export Server Actions.
// ABOUTME: Validates Clean Architecture compliance with use case integration.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the utils module
vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getRepository: vi.fn(),
  getDocumentExporter: vi.fn(),
  getProjectSettingsRepo: vi.fn(),
  getMetadataRepo: vi.fn(),
  withErrorHandling: vi.fn(async (fn) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

import { getAuthenticatedUserId, getRepository, getDocumentExporter, getProjectSettingsRepo, getMetadataRepo } from './utils';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';

// Import after mocks are set up
import { exportProject, exportProjectPdf, exportProjectLegacy } from '../actions';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { LevelStyleSet } from '@/domain/value-objects/LevelStyleSet';

describe('export-actions', () => {
  let mockRepository: {
    loadProject: ReturnType<typeof vi.fn>;
  };
  let mockSettingsRepository: {
    findByProjectId: ReturnType<typeof vi.fn>;
  };
  let mockMetadataRepository: {
    findByProjectAndType: ReturnType<typeof vi.fn>;
  };
  let mockExporter: DocumentExporter;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock repository
    mockRepository = {
      loadProject: vi.fn(),
    };
    vi.mocked(getRepository).mockResolvedValue(mockRepository as never);

    // Mock settings repository — defaults to the passerelle profile (DOCX-exportable)
    mockSettingsRepository = {
      findByProjectId: vi.fn().mockResolvedValue({
        getCoverImageUrl: () => undefined,
        getPublicationProfileId: () => 'passerelle',
      }),
    };
    vi.mocked(getProjectSettingsRepo).mockResolvedValue(mockSettingsRepository as never);

    // Mock metadata repository — returns null for all editorial annexes
    mockMetadataRepository = {
      findByProjectAndType: vi.fn().mockResolvedValue(null),
    };
    vi.mocked(getMetadataRepo).mockResolvedValue(mockMetadataRepository as never);

    // Mock exporter - implements DocumentExporter interface
    mockExporter = {
      supports: vi.fn().mockReturnValue(true),
      export: vi.fn().mockResolvedValue(Buffer.from('test')),
      exportProject: vi.fn().mockResolvedValue(Buffer.from('test-project')),
      exportChapter: vi.fn().mockResolvedValue(Buffer.from('test-chapter')),
      exportChapters: vi.fn().mockResolvedValue(Buffer.from('test-chapters')),
    };
    vi.mocked(getDocumentExporter).mockResolvedValue(mockExporter);
  });

  describe('exportProject', () => {
    it('exports project using ExportProjectUseCase for authenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const chapter = new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0);
      const project = new Project(
        'proj-123',
        'user-123',
        'My Novel',
        [chapter],
        'ch-1',
        null,
        new Date(),
        new Date()
      );
      mockRepository.loadProject.mockResolvedValue(project);

      const result = await exportProject('proj-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filename).toBe('My Novel.docx');
        expect(result.data.buffer).toEqual(Array.from(Buffer.from('test-project')));
      }

      // Verify the exporter was called via use case
      expect(getDocumentExporter).toHaveBeenCalled();
      expect(mockExporter.exportProject).toHaveBeenCalledWith(
        project,
        'My Novel.docx',
        expect.objectContaining({ coverImageUrl: undefined })
      );
    });

    it('returns error for unauthenticated user', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({
        error: { success: false, error: 'Please sign in', redirect: '/auth/signin' },
      });

      const result = await exportProject('proj-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.redirect).toBe('/auth/signin');
      }
    });

    it('returns error when project not found', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockRepository.loadProject.mockResolvedValue(null);

      const result = await exportProject('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Project not found');
      }
    });

    it('returns error when export fails', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });

      const chapter = new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0);
      const project = new Project(
        'proj-123',
        'user-123',
        'My Novel',
        [chapter],
        'ch-1',
        null,
        new Date(),
        new Date()
      );
      mockRepository.loadProject.mockResolvedValue(project);
      mockExporter.exportProject = vi.fn().mockRejectedValue(new Error('Export failed'));

      const result = await exportProject('proj-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Export failed');
      }
    });

    it('rejects DOCX export when the active profile is not passerelle', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockSettingsRepository.findByProjectId.mockResolvedValue({
        getCoverImageUrl: () => undefined,
        getPublicationProfileId: () => 'kdp-6x9',
      });

      const chapter = new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0);
      const project = new Project(
        'proj-123',
        'user-123',
        'My Novel',
        [chapter],
        'ch-1',
        null,
        new Date(),
        new Date()
      );
      mockRepository.loadProject.mockResolvedValue(project);

      const result = await exportProject('proj-123');

      expect(result.success).toBe(false);
      expect(mockExporter.exportProject).not.toHaveBeenCalled();
    });
  });

  describe('exportProjectPdf', () => {
    it('exports with the PublicationProfile derived from the active profile setting', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      const levelStyles = LevelStyleSet.defaultsFor(PublicationProfile.a5());
      mockSettingsRepository.findByProjectId.mockResolvedValue({
        getCoverImageUrl: () => undefined,
        getPublicationProfileId: () => 'a5',
        getLevelStyleSet: () => levelStyles,
      });

      const chapter = new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0);
      const project = new Project(
        'proj-123',
        'user-123',
        'My Novel',
        [chapter],
        'ch-1',
        null,
        new Date(),
        new Date()
      );
      mockRepository.loadProject.mockResolvedValue(project);

      const result = await exportProjectPdf('proj-123');

      expect(result.success).toBe(true);
      expect(mockExporter.exportProject).toHaveBeenCalledWith(
        project,
        'My Novel.pdf',
        expect.objectContaining({
          publicationProfile: PublicationProfile.fromId('a5'),
          levelStyles: levelStyles.values,
        })
      );
    });

    it('rejects PDF export when the active profile is passerelle', async () => {
      vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-123' });
      mockSettingsRepository.findByProjectId.mockResolvedValue({
        getCoverImageUrl: () => undefined,
        getPublicationProfileId: () => 'passerelle',
      });

      const chapter = new Chapter('ch-1', 'Chapter 1', '{"type":"doc","content":[]}', 0);
      const project = new Project(
        'proj-123',
        'user-123',
        'My Novel',
        [chapter],
        'ch-1',
        null,
        new Date(),
        new Date()
      );
      mockRepository.loadProject.mockResolvedValue(project);

      const result = await exportProjectPdf('proj-123');

      expect(result.success).toBe(false);
      expect(mockExporter.exportProject).not.toHaveBeenCalled();
    });
  });

  describe('exportProjectLegacy', () => {
    it('exports legacy project data using ExportProjectUseCase', async () => {
      const projectData = {
        chapters: [
          { id: 'ch-1', title: 'Chapter 1', content: '{"type":"doc","content":[]}', order: 0 },
        ],
        activeChapterId: 'ch-1',
      };

      const result = await exportProjectLegacy(projectData);

      expect('buffer' in result).toBe(true);
      if ('buffer' in result) {
        expect(result.buffer).toEqual(Array.from(Buffer.from('test-project')));
      }

      // Verify the exporter was called
      expect(getDocumentExporter).toHaveBeenCalled();
      expect(mockExporter.exportProject).toHaveBeenCalled();
    });

    it('returns error when export fails', async () => {
      mockExporter.exportProject = vi.fn().mockRejectedValue(new Error('Export failed'));

      const projectData = {
        chapters: [
          { id: 'ch-1', title: 'Chapter 1', content: '{"type":"doc","content":[]}', order: 0 },
        ],
        activeChapterId: 'ch-1',
      };

      const result = await exportProjectLegacy(projectData);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Export failed');
      }
    });
  });
});
