// ABOUTME: Tests the whole-book preview content fingerprint used for cache invalidation.
// ABOUTME: Verifies "if it shows in the PDF, it enters the hash" — chapters, order, and liminal fields.

import { describe, expect, it } from 'vitest';
import {
  computeBookPreviewContentHash,
  type BookPreviewContentHashInput,
} from './bookPreviewContentHash';
import { LevelStyleSet } from '@/domain/value-objects/LevelStyleSet';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

const base: BookPreviewContentHashInput = {
  chapters: [
    { id: 'ch-1', content: '{"type":"doc","content":[{"type":"paragraph"}]}' },
    { id: 'ch-2', content: '{"type":"doc","content":[{"type":"paragraph"}]}' },
  ],
  frontMatter: {
    title: 'Mon Roman',
    subtitle: 'Une histoire',
    authorName: 'Fanfan',
    dedicationContent: 'À toi',
    epigraphContent: 'Citation',
    copyrightYear: 2026,
    customAnnexes: [{ title: 'Note', content: 'Un mot' }],
  },
  backMatter: {
    legalNoticeContent: '© 2026',
    isbn: '978-1',
    customAnnexes: [{ title: 'Présentation', content: 'Revise Studio' }],
  },
};

describe('computeBookPreviewContentHash', () => {
  it('is deterministic for identical input', () => {
    expect(computeBookPreviewContentHash(base)).toBe(computeBookPreviewContentHash(base));
  });

  it('changes when a chapter body changes', () => {
    const changed = {
      ...base,
      chapters: [base.chapters[0], { id: 'ch-2', content: '{"type":"doc","content":[]}' }],
    };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when chapters are reordered (order is visible in the PDF)', () => {
    const reordered = { ...base, chapters: [base.chapters[1], base.chapters[0]] };
    expect(computeBookPreviewContentHash(reordered)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when a chapter is added', () => {
    const added = {
      ...base,
      chapters: [...base.chapters, { id: 'ch-3', content: '{}' }],
    };
    expect(computeBookPreviewContentHash(added)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when the book title changes', () => {
    const changed = { ...base, frontMatter: { ...base.frontMatter, title: 'Autre titre' } };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when the dedication changes (regression: "book title/liminals not refreshed")', () => {
    const changed = {
      ...base,
      frontMatter: { ...base.frontMatter, dedicationContent: 'À personne' },
    };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when the author name changes', () => {
    const changed = { ...base, frontMatter: { ...base.frontMatter, authorName: 'Quelqu’un' } };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when typography for the cache profile changes', () => {
    const defaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
    const customized = LevelStyleSet.create({
      ...defaults,
      'titre-de-chapitre': {
        ...defaults['titre-de-chapitre'],
        fontSizePoints: 22,
      },
    }).values;

    expect(
      computeBookPreviewContentHash({ ...base, levelStyles: customized }),
    ).not.toBe(computeBookPreviewContentHash({ ...base, levelStyles: defaults }));
  });

  it('changes when the legal notice (mentions légales) changes', () => {
    const changed = {
      ...base,
      backMatter: { ...base.backMatter, legalNoticeContent: 'Autres mentions' },
    };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when a back-matter custom annex changes', () => {
    const changed = {
      ...base,
      backMatter: { ...base.backMatter, customAnnexes: [{ title: 'Présentation', content: 'Autre texte' }] },
    };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when a front-matter custom annex changes', () => {
    const changed = {
      ...base,
      frontMatter: { ...base.frontMatter, customAnnexes: [{ title: 'Note', content: 'Autre' }] },
    };
    expect(computeBookPreviewContentHash(changed)).not.toBe(computeBookPreviewContentHash(base));
  });

  it('changes when tocDepth changes (invalidates the whole-book preview cache)', () => {
    expect(
      computeBookPreviewContentHash({ ...base, tocDepth: 'chapters-and-subtitles' }),
    ).not.toBe(computeBookPreviewContentHash({ ...base, tocDepth: 'chapters' }));
  });

  it('changes when tocStyle changes (invalidates the whole-book preview cache)', () => {
    expect(computeBookPreviewContentHash({ ...base, tocStyle: 'litteraire' })).not.toBe(
      computeBookPreviewContentHash({ ...base, tocStyle: 'classique' }),
    );
  });

  it('treats an absent optional field differently from an empty string', () => {
    const withoutSubtitle = {
      ...base,
      frontMatter: { ...base.frontMatter, subtitle: undefined },
    };
    expect(computeBookPreviewContentHash(withoutSubtitle)).not.toBe(
      computeBookPreviewContentHash(base),
    );
  });
});
