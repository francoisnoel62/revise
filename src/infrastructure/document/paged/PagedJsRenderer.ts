// ABOUTME: Single Paged.js renderer shared by browser preview and Chromium export.
// ABOUTME: Produces one deterministic document and exposes pagination metrics.

import type { PagedRenderer, PagedRenderRequest } from '@/application/interfaces/PagedRenderer';
import { BackMatterHtmlBuilder } from './BackMatterHtmlBuilder';
import { BookCssBuilder } from './BookCssBuilder';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import { TocHtmlBuilder } from './TocHtmlBuilder';

export class PagedJsRenderer implements PagedRenderer {
  constructor(
    private readonly cssBuilder = new BookCssBuilder(),
    private readonly frontMatterBuilder = new FrontMatterHtmlBuilder(new TipTapToBookHtml()),
    private readonly tocBuilder = new TocHtmlBuilder(),
    private readonly backMatterBuilder = new BackMatterHtmlBuilder(new TipTapToBookHtml()),
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
    const backMatterHtml = request.backMatter
      ? this.backMatterBuilder.build(request.backMatter)
      : '';

    const hasExtras = Boolean(frontMatterHtml || tocHtml || backMatterHtml);

    // Liminal pages suppress the Arabic 'page' increment (see BookCssBuilder), so the
    // first body page reads "1" while the front matter is numbered in roman folios.
    const css = this.cssBuilder.build(
      request.profile,
      assets,
      request.startPageNumber,
      request.levelStyles,
    );

    const fullBodyHtml = hasExtras
      ? `${frontMatterHtml}\n${tocHtml}\n<div class="body-matter">${request.bodyHtml}</div>\n${backMatterHtml}`
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
          const max=Math.max(0,scrollEl.scrollHeight-scrollEl.clientHeight);
          const anchorTop=(el)=>el.getBoundingClientRect().top+scrollEl.scrollTop;
          // Paged.js clones a block across a page break, so the same data-word-anchor value
          // can appear on several elements. Look up by value (first occurrence wins), never
          // by array position, or a single split anchor shifts every later boundary.
          // Mirrors resolveSyncScrollTarget.ts (kept separate + unit-tested since this
          // string runs inside the sandboxed iframe and cannot import a module).
          const byValue=new Map();
          document.querySelectorAll('[data-word-anchor]').forEach((el)=>{
            const v=Number(el.dataset.wordAnchor);
            if(!byValue.has(v))byValue.set(v,anchorTop(el));
          });
          const segmentIndex=e.data.segmentIndex||0;
          const start=segmentIndex<=0?0:(byValue.has(segmentIndex)?byValue.get(segmentIndex):max);
          const end=byValue.has(segmentIndex+1)?byValue.get(segmentIndex+1):max;
          const localRatio=Math.max(0,Math.min(1,e.data.localRatio||0));
          scrollEl.scrollTop=Math.max(0,Math.min(max,start+localRatio*(end-start)));
        }
      })})()</script>
      </body></html>`;
  }
}
