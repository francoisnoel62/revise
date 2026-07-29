// ABOUTME: Unit tests for ImportFolderUseCase
// ABOUTME: Tests folder import orchestration with mock dependencies

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportFolderUseCase } from './ImportFolderUseCase';
import { FolderParser, FolderFile } from '@/domain/interfaces/FolderParser';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { Chapter } from '@/domain/entities/Chapter';

describe('ImportFolderUseCase', () => {
  let mockParser: FolderParser;
  let mockRepository: ProjectRepository;
  let useCase: ImportFolderUseCase;

  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    return new Chapter(id, title, JSON.stringify({ type: 'doc', content: [] }), order);
  };

  beforeEach(() => {
    mockParser = {
      supports: vi.fn(),
      parseToChapters: vi.fn(),
    };

    mockRepository = {
      createProject: vi.fn(),
      loadProject: vi.fn(),
      listProjects: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
      updateChapter: vi.fn(),
      replaceProjectIfUnchanged: vi.fn(),
      deleteAllByOwner: vi.fn(),
      findPublishedByToken: vi.fn(),
    };

    useCase = new ImportFolderUseCase(mockParser, mockRepository);
  });

  const createFile = (name: string, content: string): FolderFile => ({
    name,
    relativePath: name,
    buffer: Buffer.from(content),
  });

  it('should throw error when parser does not support files', async () => {
    const files: FolderFile[] = [createFile('readme.txt', 'text')];
    vi.mocked(mockParser.supports).mockReturnValue(false);

    await expect(useCase.execute('user-1', files, 'Test Project')).rejects.toThrow(
      'Aucun fichier .md trouvé dans le dossier'
    );
  });

  it('should throw error when no chapters created', async () => {
    const files: FolderFile[] = [createFile('01-intro.md', '# Intro')];
    vi.mocked(mockParser.supports).mockReturnValue(true);
    vi.mocked(mockParser.parseToChapters).mockResolvedValue([]);

    await expect(useCase.execute('user-1', files, 'Test Project')).rejects.toThrow(
      'Aucun chapitre créé à partir du dossier'
    );
  });

  it('should create project with parsed chapters', async () => {
    const files: FolderFile[] = [
      createFile('01-intro.md', '# Intro'),
      createFile('02-chapter.md', '# Chapter'),
    ];

    const chapters = [
      createMockChapter('ch-1', 'Intro', 0),
      createMockChapter('ch-2', 'Chapter', 1),
    ];

    vi.mocked(mockParser.supports).mockReturnValue(true);
    vi.mocked(mockParser.parseToChapters).mockResolvedValue(chapters);
    vi.mocked(mockRepository.createProject).mockImplementation(async (_, p) => p);

    const project = await useCase.execute('user-1', files, 'Mon Roman');

    expect(project.getTitle()).toBe('Mon Roman');
    expect(project.getOwnerId()).toBe('user-1');
    expect(project.getChapters()).toHaveLength(2);
  });

  it('should persist project to repository', async () => {
    const files: FolderFile[] = [createFile('01-intro.md', '# Intro')];
    const chapters = [createMockChapter('ch-1', 'Intro', 0)];

    vi.mocked(mockParser.supports).mockReturnValue(true);
    vi.mocked(mockParser.parseToChapters).mockResolvedValue(chapters);
    vi.mocked(mockRepository.createProject).mockImplementation(async (_, p) => p);

    const project = await useCase.execute('user-1', files, 'Test');

    expect(mockRepository.createProject).toHaveBeenCalledWith('user-1', project);
  });

  it('should pass files to parser', async () => {
    const files: FolderFile[] = [
      createFile('01-intro.md', 'Intro content'),
      createFile('02-chapter.md', 'Chapter content'),
    ];

    const chapters = [createMockChapter('ch-1', 'Intro', 0)];

    vi.mocked(mockParser.supports).mockReturnValue(true);
    vi.mocked(mockParser.parseToChapters).mockResolvedValue(chapters);
    vi.mocked(mockRepository.createProject).mockImplementation(async (_, p) => p);

    await useCase.execute('user-1', files, 'Test');

    expect(mockParser.parseToChapters).toHaveBeenCalledWith(files);
  });

  it('should use provided project title', async () => {
    const files: FolderFile[] = [createFile('01-intro.md', '# Intro')];
    const chapters = [createMockChapter('ch-1', 'Intro', 0)];

    vi.mocked(mockParser.supports).mockReturnValue(true);
    vi.mocked(mockParser.parseToChapters).mockResolvedValue(chapters);
    vi.mocked(mockRepository.createProject).mockImplementation(async (_, p) => p);

    const project = await useCase.execute('user-1', files, 'Mon Super Roman');

    expect(project.getTitle()).toBe('Mon Super Roman');
  });
});
