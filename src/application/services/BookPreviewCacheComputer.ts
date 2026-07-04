// ABOUTME: Renders a project's whole-book PDF (front matter + TOC + body) server-side and extracts metrics.
// ABOUTME: Produces the cache entry (page counts + physical chapter offsets) and the PDF bytes for GridFS.

import type { JSONContent } from '@tiptap/core';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { BookPreviewCacheEntry, type ChapterPageOffset } from '@/domain/entities/BookPreviewCacheEntry';
import type { BrowserLauncher } from '@/infrastructure/document/paged/BrowserLauncher';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import { WholeBookHtmlAssembler } from './WholeBookHtmlAssembler';

export interface BookPreviewComputeInput {
  readonly projectId: string;
  readonly ownerId: string;
  readonly profile: PublicationProfile;
  readonly chapters: ReadonlyArray<{ id: string; title: string; content: JSONContent }>;
  readonly frontMatter: FrontMatterData;
  readonly contentHash: string;
  readonly assetBaseUrl: string;
}

export interface BookPreviewComputeResult {
  readonly entry: BookPreviewCacheEntry;
  readonly pdf: Buffer;
}

interface ExtractedMetrics {
  readonly totalPageCount: number;
  readonly frontMatterPageCount: number;
  readonly chapterOffsets: ChapterPageOffset[];
}

const PAGE_READY_TIMEOUT_MS = 30_000;

export class BookPreviewCacheComputer {
  constructor(
    private readonly launcher: BrowserLauncher,
    private readonly clock: () => Date = () => new Date(),
    private readonly renderer = new PagedJsRenderer(),
    private readonly assembler = new WholeBookHtmlAssembler(new TipTapToBookHtml()),
  ) {}

  async compute(input: BookPreviewComputeInput): Promise<BookPreviewComputeResult> {
    const { bodyHtml, tocEntries } = this.assembler.assemble(input.chapters);
    const html = this.renderer.render({
      bodyHtml,
      profile: input.profile,
      assetBaseUrl: input.assetBaseUrl,
      frontMatter: input.frontMatter,
      toc: tocEntries.length > 0 ? [...tocEntries] : undefined,
    });

    const value = input.profile.values;
    const viewport = {
      width: Math.round(value.pageWidthInches * 96),
      height: Math.round(value.pageHeightInches * 96),
    };

    const browser = await this.launcher.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForFunction(
        () => document.documentElement.dataset.pagedReady === 'true',
        { timeout: PAGE_READY_TIMEOUT_MS },
      );

      const metrics = await page.evaluate(extractMetricsFromPagedDom);

      const pdf = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        width: `${value.pageWidthInches}in`,
        height: `${value.pageHeightInches}in`,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      const entry = BookPreviewCacheEntry.create(
        {
          projectId: input.projectId,
          profileId: value.id,
          ownerId: input.ownerId,
          contentHash: input.contentHash,
          frontMatterPageCount: metrics.frontMatterPageCount,
          totalPageCount: metrics.totalPageCount,
          chapterOffsets: metrics.chapterOffsets,
        },
        this.clock(),
      );

      return { entry, pdf: Buffer.from(pdf) };
    } finally {
      await browser.close();
    }
  }
}

/**
 * Runs inside the paginated page. Reads the Paged.js page boxes to find, for each
 * chapter section, the 1-indexed physical page it starts on, and how many liminal
 * pages precede the body. Self-contained (no closure refs) so it serializes to the browser.
 */
function extractMetricsFromPagedDom(): ExtractedMetrics {
  const pages = Array.from(document.querySelectorAll('.pagedjs_pages .pagedjs_page'));
  const totalPageCount = pages.length;

  const pageIndexOf = (el: Element | null): number | null => {
    let node: Element | null = el;
    while (node && !node.classList?.contains('pagedjs_page')) {
      node = node.parentElement;
    }
    return node ? pages.indexOf(node) + 1 : null;
  };

  // Paged.js keeps the real `id` on the first fragment of a split section; later
  // fragments carry data-* markers instead, so `section.chapter[id]` yields one per chapter.
  const chapterEls = Array.from(document.querySelectorAll('section.chapter[id]'));
  const chapterOffsets: ChapterPageOffset[] = [];
  for (const el of chapterEls) {
    const pageNumber = pageIndexOf(el);
    if (pageNumber !== null) {
      chapterOffsets.push({ chapterId: el.id, pageNumber });
    }
  }

  const firstBodyPage = chapterOffsets.length > 0 ? chapterOffsets[0].pageNumber : 1;
  const frontMatterPageCount = Math.max(0, firstBodyPage - 1);

  return { totalPageCount, frontMatterPageCount, chapterOffsets };
}
