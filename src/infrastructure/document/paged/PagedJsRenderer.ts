// ABOUTME: Single Paged.js renderer shared by browser preview and Chromium export.
// ABOUTME: Produces one deterministic document and exposes pagination metrics.

import type { PagedRenderer, PagedRenderRequest } from '@/application/interfaces/PagedRenderer';
import { BookCssBuilder } from './BookCssBuilder';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import { TocHtmlBuilder } from './TocHtmlBuilder';

export class PagedJsRenderer implements PagedRenderer {
  constructor(
    private readonly cssBuilder = new BookCssBuilder(),
    private readonly frontMatterBuilder = new FrontMatterHtmlBuilder(new TipTapToBookHtml()),
    private readonly tocBuilder = new TocHtmlBuilder(),
  ) {}

  render(request: PagedRenderRequest): string {
    const assets = request.assetBaseUrl.replace(/\/$/, '');

    const frontMatterHtml = request.frontMatter
      ? this.frontMatterBuilder.build(request.frontMatter)
      : '';
    const tocHtml =
      request.toc && request.toc.length > 0
        ? this.tocBuilder.build(request.toc, request.tocStyle)
        : '';

    const hasLiminals = Boolean(frontMatterHtml || tocHtml);

    // Liminal pages suppress the Arabic 'page' increment (see BookCssBuilder), so the
    // first body page reads "1" while the front matter is numbered in roman folios.
    const css = this.cssBuilder.build(
      request.profile,
      assets,
      request.startPageNumber,
      request.levelStyles,
    );

    const fullBodyHtml = hasLiminals
      ? `${frontMatterHtml}\n${tocHtml}\n<div class="body-matter">${request.bodyHtml}</div>`
      : request.bodyHtml;

    return `<!doctype html><html lang='fr'><head><meta charset='utf-8'>
      <style>${css}</style>
      <script>window.PagedConfig={auto:false}</script>
      <script src='${assets}/vendor/paged.polyfill.min.js'></script>
      </head><body><main class='book'>${fullBodyHtml}</main>
      <script>(async()=>{
      try{
      if(!window.PagedPolyfill){throw new Error('PagedPolyfill non chargé ('+${JSON.stringify(`${assets}/vendor/paged.polyfill.min.js`)}+')');}
      await document.fonts.ready;const start=performance.now();
      const flow=await window.PagedPolyfill.preview();
      document.documentElement.dataset.pageCount=String(flow.total);
      document.documentElement.dataset.paginationMs=String(performance.now()-start);
      document.documentElement.dataset.pagedReady='true';
      window.parent.postMessage({type:'paged-rendered',pageCount:flow.total,
      sourceId:${JSON.stringify(request.sourceId ?? null)},
      paginationMs:performance.now()-start},'*')
      }catch(err){document.documentElement.dataset.pagedError=String((err&&err.message)||err);}
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
        if(e.data?.type==='sync-scroll'){
          const scrollEl=document.scrollingElement||document.documentElement;
          const max=scrollEl.scrollHeight-scrollEl.clientHeight;
          scrollEl.scrollTop=Math.max(0,max)*Math.max(0,Math.min(1,e.data.progress));
        }
      })})()</script>
      </body></html>`;
  }
}
