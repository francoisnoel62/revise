// ABOUTME: Single Paged.js renderer shared by browser preview and Chromium export.
// ABOUTME: Produces one deterministic document and exposes pagination metrics.

import type { PagedRenderer, PagedRenderRequest } from '@/application/interfaces/PagedRenderer';
import { BookCssBuilder } from './BookCssBuilder';

export class PagedJsRenderer implements PagedRenderer {
  constructor(private readonly cssBuilder = new BookCssBuilder()) {}

  render(request: PagedRenderRequest): string {
    const assets = request.assetBaseUrl.replace(/\/$/, '');
    const css = this.cssBuilder.build(request.profile, assets);
    return `<!doctype html><html lang='fr'><head><meta charset='utf-8'>
      <style>${css}</style>
      <script>window.PagedConfig={auto:false}</script>
      <script src='${assets}/vendor/paged.polyfill.min.js'></script>
      </head><body><main class='book'>${request.bodyHtml}</main>
      <script>(async()=>{await document.fonts.ready;const start=performance.now();
      const flow=await window.PagedPolyfill.preview();
      document.documentElement.dataset.pagedReady='true';
      document.documentElement.dataset.pageCount=String(flow.total);
      document.documentElement.dataset.paginationMs=String(performance.now()-start);
      window.parent.postMessage({type:'paged-rendered',pageCount:flow.total,
      paginationMs:performance.now()-start},'*')})()</script>
      </body></html>`;
  }
}
