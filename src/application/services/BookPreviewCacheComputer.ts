// ABOUTME: Renders a project's whole-book PDF (front matter + TOC + body) server-side and extracts metrics.
// ABOUTME: Produces the cache entry (page counts + physical chapter offsets) and the PDF bytes for GridFS.

import type { JSONContent } from '@tiptap/core';
import type { BackMatterData, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import {
  BookPreviewCacheEntry,
  type ChapterPageOffset,
  type SubtitlePageOffset,
} from '@/domain/entities/BookPreviewCacheEntry';
import type { BrowserLauncher } from '@/application/interfaces/BrowserLauncher';
import type { PagedRenderer } from '@/application/interfaces/PagedRenderer';
import { WholeBookHtmlAssembler } from './WholeBookHtmlAssembler';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type { TocDepth, TocStyle } from '@/domain/value-objects/TocPreferences';

export interface BookPreviewComputeInput {
  readonly projectId: string;
  readonly ownerId: string;
  readonly profile: PublicationProfile;
  readonly chapters: ReadonlyArray<{ id: string; title: string; content: JSONContent }>;
  readonly frontMatter: FrontMatterData;
  readonly backMatter?: BackMatterData;
  readonly contentHash: string;
  readonly assetBaseUrl: string;
  readonly levelStyles?: LevelStyleSetProperties;
  readonly honorBlankLines?: boolean;
  readonly tocDepth?: TocDepth;
  readonly tocStyle?: TocStyle;
  /** Custom heading for the compiled endnotes section; defaults to « Notes ». */
  readonly endnotesTitle?: string;
}

export interface BookPreviewComputeResult {
  readonly entry: BookPreviewCacheEntry;
  readonly pdf: Buffer;
}

interface ExtractedMetrics {
  readonly totalPageCount: number;
  readonly frontMatterPageCount: number;
  readonly chapterOffsets: ChapterPageOffset[];
  readonly subtitleOffsets: SubtitlePageOffset[];
}

// Paged.js paginating a whole 300-400 page book in Chromium is inherently slow
// (this is the cold-cache cost paid once; warm reads are served straight from GridFS).
// The 30s single-chapter budget is far too low here.
const PAGE_READY_TIMEOUT_MS = 120_000;

export class BookPreviewCacheComputer {
  constructor(
    private readonly launcher: BrowserLauncher,
    private readonly clock: () => Date = () => new Date(),
    private readonly renderer: PagedRenderer,
    private readonly assembler: WholeBookHtmlAssembler,
  ) {}

  async compute(input: BookPreviewComputeInput): Promise<BookPreviewComputeResult> {
    const { bodyHtml, tocEntries, endnotes } = this.assembler.assemble(input.chapters, {
      tocDepth: input.tocDepth,
      endnotesTitle: input.endnotesTitle,
    });
    const html = this.renderer.render({
      bodyHtml,
      profile: input.profile,
      assetBaseUrl: input.assetBaseUrl,
      frontMatter: input.frontMatter,
      backMatter: input.backMatter,
      toc: tocEntries.length > 0 ? [...tocEntries] : undefined,
      tocStyle: input.tocStyle,
      levelStyles: input.levelStyles,
      honorBlankLines: input.honorBlankLines,
      endnotes,
    });

    const value = input.profile.values;
    const viewport = {
      width: Math.round(value.pageWidthInches * 96),
      height: Math.round(value.pageHeightInches * 96),
    };

    const browser = await this.launcher.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport });
      // 'domcontentloaded' is enough: the blocking polyfill <script> has run by then,
      // and we wait for pagedReady below. 'networkidle' would add a needless stall.
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.pagedReady === 'true' ||
          typeof document.documentElement.dataset.pagedError === 'string',
        { timeout: PAGE_READY_TIMEOUT_MS },
      );

      const pagedError = await page.evaluate<string | null>(
        'document.documentElement.dataset.pagedError || null',
      );
      if (pagedError) {
        throw new Error(`Échec de pagination (Paged.js) : ${pagedError}`);
      }

      const metrics = await page.evaluate<ExtractedMetrics>(EXTRACT_METRICS_JS);

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
          subtitleOffsets: metrics.subtitleOffsets,
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
 * Runs inside the paginated page (passed as a string so no transpiler helpers leak
 * into the browser context). Reads the Paged.js page boxes to find, for each chapter
 * section, the 1-indexed physical page it starts on, and how many liminal pages precede
 * the body. Paged.js keeps the real `id` on the first fragment of a split section, so
 * `section.chapter[id]` yields one element per chapter.
 */
const EXTRACT_METRICS_JS = `(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll('.pagedjs_pages .pagedjs_page'));
  var totalPageCount = pages.length;
  function pageIndexOf(el) {
    var node = el;
    while (node && !(node.classList && node.classList.contains('pagedjs_page'))) {
      node = node.parentElement;
    }
    return node ? pages.indexOf(node) + 1 : null;
  }
  var chapterEls = Array.prototype.slice.call(document.querySelectorAll('section.chapter[id]'));
  var chapterOffsets = [];
  for (var i = 0; i < chapterEls.length; i++) {
    var pageNumber = pageIndexOf(chapterEls[i]);
    if (pageNumber !== null) {
      chapterOffsets.push({
        chapterId: chapterEls[i].getAttribute('data-chapter-id') || chapterEls[i].id,
        pageNumber: pageNumber
      });
    }
  }
  var firstBodyPage = chapterOffsets.length > 0 ? chapterOffsets[0].pageNumber : 1;
  var frontMatterPageCount = Math.max(0, firstBodyPage - 1);
  var subtitleEls = Array.prototype.slice.call(
    document.querySelectorAll('[data-semantic-role="sous-titre"][id]')
  );
  var subtitleOffsets = [];
  for (var j = 0; j < subtitleEls.length; j++) {
    var subtitlePageNumber = pageIndexOf(subtitleEls[j]);
    if (subtitlePageNumber !== null) {
      subtitleOffsets.push({ anchorId: subtitleEls[j].id, pageNumber: subtitlePageNumber });
    }
  }
  return {
    totalPageCount: totalPageCount,
    frontMatterPageCount: frontMatterPageCount,
    chapterOffsets: chapterOffsets,
    subtitleOffsets: subtitleOffsets
  };
})()`;
