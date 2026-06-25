// ABOUTME: Tests for GenerateMetadataUseCase — the unified metadata generation pipeline.
// ABOUTME: Uses a stub config to verify the 5 pipeline branches (cache hit, first generation,
// ABOUTME: content changed, forceRegenerate, guard clauses) independently of any concrete type.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateMetadataUseCase, MetadataTypeConfig } from '../GenerateMetadataUseCase';
import { ProjectMetadata } from '../../../domain';
import { hashText } from '../../utils/text-hash';
import { extractProjectFullText } from '../../services/project-text';

const VALID_TIPTAP = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Generated content' }] }],
});

const CHAPTER_TIPTAP = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chapter one text' }] }],
});

const mockChapter = {
  getContent: () => CHAPTER_TIPTAP,
  getTitle: () => 'Chapter 1',
};

const FULL_TEXT = extractProjectFullText([mockChapter]);
const CONTENT_HASH = hashText(FULL_TEXT);

type StubAnalysis = { value: string };

describe('GenerateMetadataUseCase', () => {
  const mockMetadataRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByProjectAndType: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteByProjectId: vi.fn(),
    deleteAllByOwner: vi.fn(),
  };

  const mockProjectRepository = {
    loadProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    listProjects: vi.fn(),
    updateChapter: vi.fn(),
    deleteAllByOwner: vi.fn(),
    findPublishedByToken: vi.fn(),
  };

  const mockLLMProvider = {} as never;

  const mockIdGenerator = {
    generate: vi.fn().mockReturnValue('generated-id'),
  };

  const mockGenerate = vi.fn<[never, string], Promise<StubAnalysis>>();

  const stubConfig: MetadataTypeConfig<StubAnalysis> = {
    typeKey: 'narrative-analysis',
    title: 'Analyse Narrative',
    generate: mockGenerate,
    format: () => VALID_TIPTAP,
  };

  let useCase: GenerateMetadataUseCase<StubAnalysis>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockResolvedValue({ value: 'stub-analysis' });
    mockProjectRepository.loadProject.mockResolvedValue({ getChapters: () => [mockChapter] });
    useCase = new GenerateMetadataUseCase(
      mockMetadataRepository,
      mockProjectRepository,
      mockLLMProvider,
      mockIdGenerator,
      stubConfig
    );
  });

  describe('cache hit — content unchanged', () => {
    it('returns wasCached: true without calling config.generate', async () => {
      const cachedMetadata = ProjectMetadata.createGenerated(
        'existing-id',
        'project-1',
        'narrative-analysis',
        'Analyse Narrative',
        VALID_TIPTAP,
        CONTENT_HASH
      );
      mockMetadataRepository.findByProjectAndType.mockResolvedValue(cachedMetadata);

      const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

      expect(result.wasCached).toBe(true);
      expect(result.wasUpdated).toBe(false);
      expect(mockGenerate).not.toHaveBeenCalled();
      expect(mockMetadataRepository.create).not.toHaveBeenCalled();
      expect(mockMetadataRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('first generation — no existing metadata', () => {
    it('calls config.generate, creates metadata, returns wasCached: false, wasUpdated: false', async () => {
      mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);

      const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

      expect(result.wasCached).toBe(false);
      expect(result.wasUpdated).toBe(false);
      expect(mockGenerate).toHaveBeenCalledWith(mockLLMProvider, FULL_TEXT);
      expect(mockMetadataRepository.create).toHaveBeenCalledOnce();
      expect(mockMetadataRepository.update).not.toHaveBeenCalled();
      expect(result.metadata).toBeInstanceOf(ProjectMetadata);
    });
  });

  describe('content changed — stale hash', () => {
    it('calls config.generate, updates metadata, returns wasUpdated: true', async () => {
      const staleMetadata = ProjectMetadata.createGenerated(
        'existing-id',
        'project-1',
        'narrative-analysis',
        'Analyse Narrative',
        VALID_TIPTAP,
        'old-hash-different'
      );
      mockMetadataRepository.findByProjectAndType.mockResolvedValue(staleMetadata);

      const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

      expect(result.wasCached).toBe(false);
      expect(result.wasUpdated).toBe(true);
      expect(mockGenerate).toHaveBeenCalledOnce();
      expect(mockMetadataRepository.update).toHaveBeenCalledOnce();
      expect(mockMetadataRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('forceRegenerate — bypasses cache', () => {
    it('calls config.generate even when hash is current', async () => {
      const freshMetadata = ProjectMetadata.createGenerated(
        'existing-id',
        'project-1',
        'narrative-analysis',
        'Analyse Narrative',
        VALID_TIPTAP,
        CONTENT_HASH
      );
      mockMetadataRepository.findByProjectAndType.mockResolvedValue(freshMetadata);

      const result = await useCase.execute({
        ownerId: 'user-1',
        projectId: 'project-1',
        forceRegenerate: true,
      });

      expect(result.wasCached).toBe(false);
      expect(mockGenerate).toHaveBeenCalledOnce();
      expect(mockMetadataRepository.update).toHaveBeenCalledOnce();
    });
  });

  describe('guard clauses', () => {
    it('throws when project is not found', async () => {
      mockProjectRepository.loadProject.mockResolvedValue(null);

      await expect(
        useCase.execute({ ownerId: 'user-1', projectId: 'project-1' })
      ).rejects.toThrow('Project not found');
    });

    it('throws when project has no chapters', async () => {
      mockProjectRepository.loadProject.mockResolvedValue({ getChapters: () => [] });

      await expect(
        useCase.execute({ ownerId: 'user-1', projectId: 'project-1' })
      ).rejects.toThrow('no chapters');
    });

    it('throws when chapters have no extractable content', async () => {
      const emptyChapter = {
        getContent: () => JSON.stringify({ type: 'doc', content: [] }),
        getTitle: () => 'Empty',
      };
      mockProjectRepository.loadProject.mockResolvedValue({
        getChapters: () => [emptyChapter],
      });

      await expect(
        useCase.execute({ ownerId: 'user-1', projectId: 'project-1' })
      ).rejects.toThrow('no content');
    });
  });
});
