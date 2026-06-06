// ABOUTME: Tests for CheckMetadataFreshnessUseCase
// ABOUTME: Verifies per-metadata staleness against the current project full-text hash

import { describe, it, expect, vi } from 'vitest';
import { CheckMetadataFreshnessUseCase } from '../CheckMetadataFreshnessUseCase';
import { ProjectMetadata } from '../../../domain/entities/ProjectMetadata';
import { extractProjectFullText } from '../../services/project-text';
import { hashText } from '../../utils/text-hash';

const chapterJson = (text: string) =>
  JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

const chapter = (title: string, text: string) => ({
  getTitle: () => title,
  getContent: () => chapterJson(text),
});

const metaContent = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'analysis' }] }],
});

const projectRepo = (project: unknown) => ({
  loadProject: vi.fn().mockResolvedValue(project),
  createProject: vi.fn(),
  listProjects: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
});

const metadataRepo = (items: ProjectMetadata[]) => ({
  findByProjectId: vi.fn().mockResolvedValue(items),
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectAndType: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

describe('CheckMetadataFreshnessUseCase', () => {
  const chapters = [chapter('Chapitre 1', 'Histoire complète du roman')];
  const project = { getChapters: () => chapters };
  const currentHash = hashText(extractProjectFullText(chapters));

  it('marks a generated metadata stale when the source hash differs', async () => {
    const stale = ProjectMetadata.createGenerated(
      'm-stale', 'p1', 'narrative-analysis', 'Analyse', metaContent, 'old-hash', '{}'
    );
    const useCase = new CheckMetadataFreshnessUseCase(metadataRepo([stale]) as never, projectRepo(project) as never);

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

    expect(result).toEqual([{ id: 'm-stale', typeKey: 'narrative-analysis', isStale: true }]);
  });

  it('marks a generated metadata fresh when the source hash matches', async () => {
    const fresh = ProjectMetadata.createGenerated(
      'm-fresh', 'p1', 'narrative-analysis', 'Analyse', metaContent, currentHash, '{}'
    );
    const useCase = new CheckMetadataFreshnessUseCase(metadataRepo([fresh]) as never, projectRepo(project) as never);

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

    expect(result[0].isStale).toBe(false);
  });

  it('never marks a non-generated (manual / editorial) metadata stale', async () => {
    const manual = ProjectMetadata.createEmpty('m-manual', 'p1', 'dedication', 'Dédicace');
    const useCase = new CheckMetadataFreshnessUseCase(metadataRepo([manual]) as never, projectRepo(project) as never);

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

    expect(result[0].isStale).toBe(false);
  });

  it('marks stale a manually-edited fiche when the manuscript has changed after the edit', async () => {
    // Author edits the fiche (step 3), then modifies the manuscript (step 5) → still stale.
    const editedAfterGeneration = new ProjectMetadata(
      'm-edited', 'p1', 'narrative-analysis', 'Analyse', metaContent,
      {
        isGenerated: true,
        generatedAt: new Date('2025-01-01T10:00:00Z'),
        lastEdited: new Date('2025-06-01T12:00:00Z'), // edited well after generation
        contentHash: 'old-hash', // manuscript has since changed
        structuredData: '{}',
      }
    );
    const useCase = new CheckMetadataFreshnessUseCase(
      metadataRepo([editedAfterGeneration]) as never,
      projectRepo(project) as never
    );

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

    expect(result[0].isStale).toBe(true);
  });

  it('does NOT mark stale a manually-edited fiche when the manuscript hash matches', async () => {
    // Author edits the fiche, but the manuscript hasn't changed → hash still matches → not stale.
    const editedButHashOk = new ProjectMetadata(
      'm-edited-ok', 'p1', 'narrative-analysis', 'Analyse', metaContent,
      {
        isGenerated: true,
        generatedAt: new Date('2025-01-01T10:00:00Z'),
        lastEdited: new Date('2025-06-01T12:00:00Z'),
        contentHash: currentHash,
        structuredData: '{}',
      }
    );
    const useCase = new CheckMetadataFreshnessUseCase(
      metadataRepo([editedButHashOk]) as never,
      projectRepo(project) as never
    );

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

    expect(result[0].isStale).toBe(false);
  });

  it('marks nothing stale when the project has no text', async () => {
    const emptyProject = {
      getChapters: () => [
        { getTitle: () => 'Vide', getContent: () => JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }) },
      ],
    };
    const generated = ProjectMetadata.createGenerated(
      'm1', 'p1', 'narrative-analysis', 'Analyse', metaContent, 'some-hash', '{}'
    );
    const useCase = new CheckMetadataFreshnessUseCase(
      metadataRepo([generated]) as never,
      projectRepo(emptyProject) as never
    );

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

    expect(result[0].isStale).toBe(false);
  });

  it('returns an empty list when the project is not found', async () => {
    const useCase = new CheckMetadataFreshnessUseCase(metadataRepo([]) as never, projectRepo(null) as never);

    const result = await useCase.execute({ ownerId: 'u1', projectId: 'missing' });

    expect(result).toEqual([]);
  });
});
