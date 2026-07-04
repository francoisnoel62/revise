// ABOUTME: Single Paged.js renderer shared by browser preview and Chromium export.
// ABOUTME: Produces one deterministic document and exposes pagination metrics.

import type { PagedRenderer, PagedRenderRequest } from '@/application/interfaces/PagedRenderer';
import { BookCssBuilder } from './BookCssBuilder';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import { TocHtmlBuilder } from './TocHtmlBuilder';

export class PagedJsRenderer implements PagedRenderer {
  constructor(
    private readonly cssBuilder = new BookCssBuilder(),
    private readonly frontMatterBuilder = new FrontMatterHtmlBuilder(),
    private readonly tocBuilder = new TocHtmlBuilder(),
  ) {}

  render(request: PagedRenderRequest): string {
    const assets = request.assetBaseUrl.replace(/\/$/, '');

    const frontMatterHtml = request.frontMatter
      ? this.frontMatterBuilder.build(request.frontMatter)
      : '';
    const tocHtml =
      request.toc && request.toc.length > 0 ? this.tocBuilder.build(request.toc) : '';

    const hasLiminals = Boolean(frontMatterHtml || tocHtml);

    // When roman-numeral liminal pages precede the body, restart the Arabic page
    // counter at the body-matter boundary so the first chapter page reads "1".
    const css = this.cssBuilder.build(request.profile, assets, request.startPageNumber, hasLiminals);

    const fullBodyHtml = hasLiminals
      ? `${frontMatterHtml}\n${tocHtml}\n<div class="body-matter">${request.bodyHtml}</div>`
      : request.bodyHtml;

    return `<!doctype html><html lang='fr'><head><meta charset='utf-8'>
      <style>${css}</style>
      <script>window.PagedConfig={auto:false}</script>
      <script src='${assets}/vendor/paged.polyfill.min.js'></script>
      </head><body><main class='book'>${fullBodyHtml}</main>
      <script>(async()=>{await document.fonts.ready;const start=performance.now();
      const flow=await window.PagedPolyfill.preview();
      document.documentElement.dataset.pagedReady='true';
      document.documentElement.dataset.pageCount=String(flow.total);
      document.documentElement.dataset.paginationMs=String(performance.now()-start);
      window.parent.postMessage({type:'paged-rendered',pageCount:flow.total,
      sourceId:${JSON.stringify(request.sourceId ?? null)},
      paginationMs:performance.now()-start},'*')
      window.addEventListener('message',(e)=>{
        if(e.data?.type==='navigate-to-chapter'){
          const el=document.getElementById(e.data.chapterId);
          if(!el)return;
          let target=el;
          while(target.parentElement&&!target.classList.contains('pagedjs_page')){
            target=target.parentElement;
          }
          target.scrollIntoView({behavior:'smooth'});
        }
      })})()</script>
      </body></html>`;
  }
}
