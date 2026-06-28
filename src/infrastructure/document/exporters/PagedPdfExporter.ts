// ABOUTME: PDF exporter producing preview-parity output via the paged renderer (Paged.js + Chromium).
// ABOUTME: Pipeline: TipTap JSON → semantic HTML → publication CSS → Chromium PDF.

import type { JSONContent } from '@tiptap/core';
import type { DocumentExporter, ExportOptions } from '@/domain/interfaces/DocumentExporter';
import type { Project } from '@/domain/entities/Project';
import type { Chapter } from '@/domain/entities/Chapter';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import type { BrowserLauncher } from '../paged/BrowserLauncher';
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

    return this.renderToPdf(chapters, options?.publicationProfile);
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
  ): Promise<Buffer> {
    const bodyParts: string[] = [];
    for (const chapter of chapters) {
      if (chapter.title) {
        bodyParts.push(`<h1>${this.escapeHtml(chapter.title)}</h1>`);
        bodyParts.push(this.converter.convertChapter(chapter.content, chapter.title));
      } else {
        bodyParts.push(this.converter.convert(chapter.content));
      }
    }

    const html = this.renderer.render({
      bodyHtml: bodyParts.join('\n'),
      profile,
      assetBaseUrl: this.assetBaseUrl,
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
