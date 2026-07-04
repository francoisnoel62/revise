// ABOUTME: PDF exporter producing preview-parity output via the paged renderer (Paged.js + Chromium).
// ABOUTME: Pipeline: TipTap JSON → semantic HTML → publication CSS → Chromium PDF.

import type { JSONContent } from '@tiptap/core';
import type { DocumentExporter, ExportOptions, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import type { Project } from '@/domain/entities/Project';
import type { Chapter } from '@/domain/entities/Chapter';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import type { BrowserLauncher } from '../paged/BrowserLauncher';
import type { TocEntry } from '@/application/interfaces/PagedRenderer';
import { PagedJsRenderer } from '../paged/PagedJsRenderer';
import { TipTapToBookHtml } from '../paged/TipTapToBookHtml';

export class PagedPdfExporter implements DocumentExporter {
  constructor(
    private readonly assetBaseUrl: string,
    private readonly launcher: BrowserLauncher,
    private readonly renderer = new PagedJsRenderer(),
    private readonly converter = new TipTapToBookHtml(),
  ) {}

  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  async export(content: string, filename: string): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported file format: ${filename}`);
    }

    const paragraphs = content.split(/\n+/).filter((p) => p.trim());
    const doc: JSONContent = {
      type: 'doc',
      content: paragraphs.length > 0
        ? paragraphs.map((text) => ({
            type: 'paragraph',
            content: [{ type: 'text', text }],
          }))
        : [{ type: 'paragraph', content: [] }],
    };

    return this.renderToPdf([{ content: doc }]);
  }

  async exportProject(project: Project, filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    const chapters = project.getChapters().map((ch) => ({
      title: ch.getTitle(),
      content: JSON.parse(ch.getContent()) as JSONContent,
    }));

    return this.renderToPdf(chapters, options?.publicationProfile, options?.frontMatter);
  }

  async exportChapter(chapter: Chapter, filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    return this.renderToPdf([{
      title: chapter.getTitle(),
      content: JSON.parse(chapter.getContent()) as JSONContent,
    }], options?.publicationProfile);
  }

  async exportChapters(chapters: Chapter[], filename: string, options?: ExportOptions): Promise<Buffer> {
    if (!this.supports(filename)) {
      throw new Error(`Unsupported export format: ${filename}`);
    }

    if (chapters.length === 0) {
      throw new Error('No chapters to export');
    }

    const chapterData = chapters.map((ch) => ({
      title: ch.getTitle(),
      content: JSON.parse(ch.getContent()) as JSONContent,
    }));

    return this.renderToPdf(chapterData, options?.publicationProfile);
  }

  private async renderToPdf(
    chapters: Array<{ title?: string; content: JSONContent }>,
    profile: PublicationProfile = PublicationProfile.kdpSixByNine(),
    frontMatter?: FrontMatterData,
  ): Promise<Buffer> {
    const bodyParts: string[] = [];
    const tocEntries: TocEntry[] = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const chapterId = `ch-${i}`;
      const chapterContent = this.converter.convert(chapter.content);

      bodyParts.push(`<section id="${chapterId}" class="chapter">${chapterContent}</section>`);

      if (chapter.title) {
        tocEntries.push({ title: chapter.title, chapterId });
      }
    }

    // Show TOC whenever there are at least 2 titled chapters; does not require front matter.
    const toc = tocEntries.length > 1 ? tocEntries : undefined;

    const html = this.renderer.render({
      bodyHtml: bodyParts.join('\n'),
      profile,
      assetBaseUrl: this.assetBaseUrl,
      frontMatter,
      toc,
    });

    const browser = await this.launcher.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 576, height: 864 } });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.documentElement.dataset.pagedReady === 'true', { timeout: 30_000 });
      const pdf = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        width: `${profile.values.pageWidthInches}in`,
        height: `${profile.values.pageHeightInches}in`,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
