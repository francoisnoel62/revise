// ABOUTME: Tests for the whole-book preview action — lazy cache generation and invalidation.
// ABOUTME: Verifies fresh/stale/cold cache branching, liminal invalidation, passerelle, profile list.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getRepository: vi.fn(),
  getProjectSettingsRepo: vi.fn(),
  getMetadataRepo: vi.fn(),
  getBookPreviewCacheRepo: vi.fn(),
  getBookPreviewCacheComputer: vi.fn(),
  withErrorHandling: vi.fn(async (fn) => {
    try {
      return { success: true, data: await fn() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }),
}));

import {
  getAuthenticatedUserId,
  getRepository,
  getProjectSettingsRepo,
  getMetadataRepo,
  getBookPreviewCacheRepo,
  getBookPreviewCacheComputer,
} from './utils';
import { getBookPreviewDataAction } from './book-preview-actions';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';
import { BookPreviewCacheEntry } from '@/domain/entities/BookPreviewCacheEntry';
import { computeBookPreviewContentHash } from '@/application/services/bookPreviewContentHash';
import { LevelStyleSet, type LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import type { TocPreferences } from '@/domain/value-objects/TocPreferences';

const CONTENT = '{"type":"doc","content":[{"type":"paragraph"}]}';

const CHAPTER_WITH_SUBTITLE_CONTENT = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: 'Chapitre 1' }] },
    { type: 'heading', attrs: { level: 2, semanticRole: 'sous-titre' }, content: [{ type: 'text', text: 'Sous-titre A' }] },
  ],
});

function makeProject(): Project {
  const chapters = [
    new Chapter('ch-1', 'Chapitre 1', CONTENT, 0),
    new Chapter('ch-2', 'Chapitre 2', CONTENT, 1),
  ];
  return new Project('proj-1', 'user-1', 'Mon Roman', chapters, 'ch-1', null, new Date(), new Date());
}

function makeProjectWithSubtitle(): Project {
  const chapters = [
    new Chapter('ch-1', 'Chapitre 1', CHAPTER_WITH_SUBTITLE_CONTENT, 0),
    new Chapter('ch-2', 'Chapitre 2', CONTENT, 1),
  ];
  return new Project('proj-1', 'user-1', 'Mon Roman', chapters, 'ch-1', null, new Date(), new Date());
}

function frontMatterFor(dedication?: string) {
  return {
    title: 'Mon Roman',
    subtitle: undefined,
    authorName: 'Fanfan',
    isbn: undefined,
    dedicationContent: dedication,
    copyrightContent: undefined,
    epigraphContent: undefined,
  };
}

const DEFAULT_TOC_PREFS: TocPreferences = { depth: 'chapters', style: 'classique' };

function hashFor(
  dedication?: string,
  levelStyles?: LevelStyleSetProperties,
  tocPreferences: TocPreferences = DEFAULT_TOC_PREFS,
): string {
  return computeBookPreviewContentHash({
    chapters: [
      { id: 'ch-1', content: CONTENT },
      { id: 'ch-2', content: CONTENT },
    ],
    frontMatter: frontMatterFor(dedication),
    levelStyles,
    tocDepth: tocPreferences.depth,
    tocStyle: tocPreferences.style,
  });
}

function cachedEntry(
  contentHash: string,
  subtitleOffsets: Array<{ anchorId: string; pageNumber: number }> = [],
): BookPreviewCacheEntry {
  return BookPreviewCacheEntry.create(
    {
      projectId: 'proj-1',
      profileId: 'kdp-6x9',
      ownerId: 'user-1',
      contentHash,
      frontMatterPageCount: 4,
      totalPageCount: 120,
      chapterOffsets: [
        { chapterId: 'ch-1', pageNumber: 5 },
        { chapterId: 'ch-2', pageNumber: 41 },
      ],
      subtitleOffsets,
    },
    new Date('2026-07-05T10:00:00Z'),
  );
}

describe('getBookPreviewDataAction', () => {
  let cacheRepo: { loadMetrics: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let computer: { compute: ReturnType<typeof vi.fn> };
  let profileId: string;
  let dedication: string | undefined;
  let kdpLevelStyles: LevelStyleSetProperties | undefined;
  let tocPreferences: TocPreferences;
  let project: Project;

  beforeEach(() => {
    vi.clearAllMocks();
    profileId = 'kdp-6x9';
    dedication = undefined;
    kdpLevelStyles = undefined;
    tocPreferences = DEFAULT_TOC_PREFS;
    project = makeProject();

    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getRepository).mockResolvedValue({ loadProject: vi.fn(async () => project) } as never);
    vi.mocked(getProjectSettingsRepo).mockResolvedValue({
      findByProjectId: vi.fn().mockResolvedValue({
        getPublicationProfileId: () => profileId,
        getTitle: () => 'Mon Roman',
        getSubtitle: () => undefined,
        getIsbn: () => undefined,
        getContributors: () => [{ role: 'author', name: 'Fanfan' }],
        getLevelStyleSet: (requestedProfileId: string) =>
          requestedProfileId === 'kdp-6x9' && kdpLevelStyles
            ? LevelStyleSet.create(kdpLevelStyles)
            : undefined,
        getTocPreferences: () => tocPreferences,
      }),
    } as never);
    vi.mocked(getMetadataRepo).mockResolvedValue({
      findByProjectAndType: vi.fn(async (_u: string, _p: string, type: string) =>
        type === 'dedication' && dedication ? { getContent: () => dedication } : null,
      ),
    } as never);

    cacheRepo = { loadMetrics: vi.fn().mockResolvedValue(null), save: vi.fn().mockResolvedValue(undefined) };
    computer = {
      compute: vi.fn().mockImplementation(async ({ contentHash }: { contentHash: string }) => ({
        entry: cachedEntry(contentHash),
        pdf: Buffer.from('%PDF fake'),
      })),
    };
    vi.mocked(getBookPreviewCacheRepo).mockResolvedValue(cacheRepo as never);
    vi.mocked(getBookPreviewCacheComputer).mockReturnValue(computer as never);
  });

  it('generates and caches the PDF on a cold cache, returning chapter page offsets', async () => {
    const result = await getBookPreviewDataAction('proj-1');

    expect(result.success).toBe(true);
    expect(computer.compute).toHaveBeenCalledTimes(1);
    expect(cacheRepo.save).toHaveBeenCalledTimes(1);
    const data = result.success ? result.data : null;
    expect(data!.isPasserelle).toBe(false);
    expect(data!.profileId).toBe('kdp-6x9');
    expect(data!.availableProfiles).toEqual(['kdp-6x9', 'a5']);
    expect(data!.totalPageCount).toBe(120);
    expect(data!.chapters).toEqual([
      { id: 'ch-1', title: 'Chapitre 1', pageNumber: 5 },
      { id: 'ch-2', title: 'Chapitre 2', pageNumber: 41 },
    ]);
  });

  it('serves a fresh cache without regenerating', async () => {
    cacheRepo.loadMetrics.mockResolvedValue(cachedEntry(hashFor()));

    const result = await getBookPreviewDataAction('proj-1');

    expect(result.success).toBe(true);
    expect(computer.compute).not.toHaveBeenCalled();
    expect(cacheRepo.save).not.toHaveBeenCalled();
  });

  it('regenerates when the cached contentHash is stale', async () => {
    cacheRepo.loadMetrics.mockResolvedValue(cachedEntry('stale-hash'));

    await getBookPreviewDataAction('proj-1');

    expect(computer.compute).toHaveBeenCalledTimes(1);
    expect(cacheRepo.save).toHaveBeenCalledTimes(1);
  });

  it('regenerates when only the liminals change (dedication added) — freshness regression guard', async () => {
    // Cache was computed with no dedication; now the author added one.
    cacheRepo.loadMetrics.mockResolvedValue(cachedEntry(hashFor(undefined)));
    dedication = 'À toi';

    await getBookPreviewDataAction('proj-1');

    expect(computer.compute).toHaveBeenCalledTimes(1);
  });

  it('invalidates only the cache profile whose typography changed', async () => {
    const defaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
    kdpLevelStyles = LevelStyleSet.create({
      ...defaults,
      'titre-de-chapitre': { ...defaults['titre-de-chapitre'], fontSizePoints: 22 },
    }).values;

    cacheRepo.loadMetrics.mockImplementation(async (_projectId, requestedProfileId) =>
      requestedProfileId === 'kdp-6x9'
        ? cachedEntry(hashFor(undefined, defaults))
        : cachedEntry(hashFor(undefined)),
    );

    await getBookPreviewDataAction('proj-1');
    expect(computer.compute).toHaveBeenCalledTimes(1);
    expect(computer.compute).toHaveBeenCalledWith(
      expect.objectContaining({ levelStyles: kdpLevelStyles }),
    );

    computer.compute.mockClear();
    await getBookPreviewDataAction('proj-1', 'a5');
    expect(computer.compute).not.toHaveBeenCalled();
  });

  it('returns isPasserelle without generating when the active profile is passerelle', async () => {
    profileId = 'passerelle';

    const result = await getBookPreviewDataAction('proj-1');

    expect(result.success).toBe(true);
    const data = result.success ? result.data : null;
    expect(data!.isPasserelle).toBe(true);
    expect(computer.compute).not.toHaveBeenCalled();
  });

  it('honours an explicit preview profile that differs from the project profile', async () => {
    const result = await getBookPreviewDataAction('proj-1', 'a5');

    expect(result.success).toBe(true);
    const data = result.success ? result.data : null;
    expect(data!.profileId).toBe('a5');
    expect(cacheRepo.loadMetrics).toHaveBeenCalledWith('proj-1', 'a5', 'user-1');
  });

  describe('toc settings (depth + style)', () => {
    it('passes tocDepth and tocStyle from project settings to the computer', async () => {
      tocPreferences = { depth: 'chapters-and-subtitles', style: 'epure' };

      await getBookPreviewDataAction('proj-1');

      expect(computer.compute).toHaveBeenCalledWith(
        expect.objectContaining({ tocDepth: 'chapters-and-subtitles', tocStyle: 'epure' }),
      );
    });

    it('regenerates when tocDepth/tocStyle changed since the cache was computed', async () => {
      cacheRepo.loadMetrics.mockResolvedValue(cachedEntry(hashFor(undefined, undefined, DEFAULT_TOC_PREFS)));
      tocPreferences = { depth: 'chapters-and-subtitles', style: 'classique' };

      await getBookPreviewDataAction('proj-1');

      expect(computer.compute).toHaveBeenCalledTimes(1);
    });

    it('does not regenerate when the cache already matches the current toc settings', async () => {
      tocPreferences = { depth: 'chapters-and-subtitles', style: 'epure' };
      cacheRepo.loadMetrics.mockResolvedValue(cachedEntry(hashFor(undefined, undefined, tocPreferences)));

      await getBookPreviewDataAction('proj-1');

      expect(computer.compute).not.toHaveBeenCalled();
    });

    it('exposes nested sous-titre sub-entries with resolved page numbers when tocDepth includes subtitles', async () => {
      project = makeProjectWithSubtitle();
      tocPreferences = { depth: 'chapters-and-subtitles', style: 'classique' };
      cacheRepo.loadMetrics.mockResolvedValue(null);
      computer.compute.mockResolvedValue({
        entry: cachedEntry(hashFor(undefined, undefined, tocPreferences), [
          { anchorId: 'chapter-ch-1-soustitre-0', pageNumber: 6 },
        ]),
        pdf: Buffer.from('%PDF fake'),
      });

      const result = await getBookPreviewDataAction('proj-1');

      expect(result.success).toBe(true);
      const data = result.success ? result.data : null;
      expect(data!.chapters[0].subEntries).toEqual([
        { anchorId: 'chapter-ch-1-soustitre-0', title: 'Sous-titre A', pageNumber: 6 },
      ]);
    });

    it('omits subEntries when tocDepth is "chapters" (unchanged default)', async () => {
      project = makeProjectWithSubtitle();

      const result = await getBookPreviewDataAction('proj-1');

      expect(result.success).toBe(true);
      const data = result.success ? result.data : null;
      expect(data!.chapters[0].subEntries).toBeUndefined();
    });

    it('invalidates every profile cache entry when toc settings change (global setting, unlike per-profile typography)', async () => {
      // Both profiles were cached under the old toc preferences.
      cacheRepo.loadMetrics.mockImplementation(async () => cachedEntry(hashFor(undefined, undefined, DEFAULT_TOC_PREFS)));
      tocPreferences = { depth: 'chapters-and-subtitles', style: 'litteraire' };

      await getBookPreviewDataAction('proj-1');
      expect(computer.compute).toHaveBeenCalledTimes(1);

      computer.compute.mockClear();
      await getBookPreviewDataAction('proj-1', 'a5');
      expect(computer.compute).toHaveBeenCalledTimes(1);
    });
  });
});
