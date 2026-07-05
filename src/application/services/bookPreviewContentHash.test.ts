// ABOUTME: Tests the whole-book preview content fingerprint used for cache invalidation.
// ABOUTME: Verifies "if it shows in the PDF, it enters the hash" — chapters, order, and liminal fields.

import { describe, expect, it } from 'vitest';
import {
  computeBookPreviewContentHash,
  type BookPreviewContentHashInput,
} from './bookPreviewContentHash';

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
    copyrightContent: '© 2026',
    epigraphContent: 'Citation',
    isbn: '978-1',
    copyrightYear: 2026,
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
