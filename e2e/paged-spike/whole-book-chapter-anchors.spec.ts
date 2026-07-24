// ABOUTME: Regression coverage for whole-book TOC anchors built from persisted chapter UUIDs.
// ABOUTME: Exercises the real Paged.js pipeline when a UUID starts with a digit.

import { expect, test } from '@playwright/test';
import type { JSONContent } from '@tiptap/core';
import { BookPreviewCacheComputer } from '../../src/application/services/BookPreviewCacheComputer';
import { WholeBookHtmlAssembler } from '../../src/application/services/WholeBookHtmlAssembler';
import { PublicationProfile } from '../../src/domain/value-objects/PublicationProfile';
import { PlaywrightBrowserLauncher } from '../../src/infrastructure/document/paged/PlaywrightBrowserLauncher';
import { PagedJsRenderer } from '../../src/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '../../src/infrastructure/document/paged/TipTapToBookHtml';

const paragraph = (text: string): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

test.setTimeout(120_000);

test('whole-book pagination accepts chapter UUIDs starting with a digit', async () => {
  const numericChapterId = '004bee1e-9ba3-48c3-aedd-2c0a026598dd';
  const otherChapterId = 'a04bee1e-9ba3-48c3-aedd-2c0a026598dd';
  const computer = new BookPreviewCacheComputer(
    new PlaywrightBrowserLauncher(),
    () => new Date(),
    new PagedJsRenderer(),
    new WholeBookHtmlAssembler(new TipTapToBookHtml()),
  );

  const { entry } = await computer.compute({
    projectId: 'project-anchor-regression',
    ownerId: 'owner-anchor-regression',
    profile: PublicationProfile.kdpSixByNine(),
    chapters: [
      { id: numericChapterId, title: 'Premier', content: paragraph('Premier chapitre.') },
      { id: otherChapterId, title: 'Second', content: paragraph('Second chapitre.') },
    ],
    frontMatter: { title: 'Test des ancres' },
    contentHash: 'anchor-regression',
    assetBaseUrl: 'http://localhost:3000',
  });

  expect(entry.getChapterOffsets().map((offset) => offset.chapterId)).toEqual([
    numericChapterId,
    otherChapterId,
  ]);
});
