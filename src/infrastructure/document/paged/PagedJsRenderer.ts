// ABOUTME: Single Paged.js renderer shared by browser preview and Chromium export.
// ABOUTME: Produces one deterministic document and exposes pagination metrics.

import type { PagedRenderer, PagedRenderRequest } from '@/application/interfaces/PagedRenderer';
import { BackMatterHtmlBuilder } from './BackMatterHtmlBuilder';
import { BookCssBuilder } from './BookCssBuilder';
import { EndnotesHtmlBuilder } from './EndnotesHtmlBuilder';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import { TocHtmlBuilder } from './TocHtmlBuilder';

export class PagedJsRenderer implements PagedRenderer {
  constructor(
    private readonly cssBuilder = new BookCssBuilder(),
    private readonly frontMatterBuilder = new FrontMatterHtmlBuilder(new TipTapToBookHtml()),
    private readonly tocBuilder = new TocHtmlBuilder(),
    private readonly backMatterBuilder = new BackMatterHtmlBuilder(new TipTapToBookHtml()),
    private readonly endnotesBuilder = new EndnotesHtmlBuilder(new TipTapToBookHtml()),
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
    const endnotesHtml = request.endnotes
      ? this.endnotesBuilder.build(request.endnotes.chapters, request.endnotes.title)
      : '';

    const hasExtras = Boolean(frontMatterHtml || tocHtml || backMatterHtml || endnotesHtml);

    // Liminal pages suppress the Arabic 'page' increment (see BookCssBuilder), so the
    // first body page reads "1" while the front matter is numbered in roman folios.
    const css = this.cssBuilder.build(
      request.profile,
      assets,
      request.startPageNumber,
      request.levelStyles,
    );

    // Endnotes are back matter: after the body, before the legal-notice colophon (the last page).
    const fullBodyHtml = hasExtras
      ? `${frontMatterHtml}\n${tocHtml}\n<div class="body-matter">${request.bodyHtml}</div>\n${endnotesHtml}\n${backMatterHtml}`
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
      <script>(function(){
      // Endnote reading bubble. Mirrors endnoteBubble.ts (nextOpenEndnoteId + positionEndnoteBubble),
      // kept in sync manually since this runs inside the sandboxed iframe and cannot import a module.
      // A single body-level, position: fixed bubble escapes the clipped Paged.js page boxes.
      var MARGIN=8, GAP=6;
      var bubble=document.createElement('div');
      bubble.id='endnote-bubble';
      bubble.setAttribute('role','tooltip');
      document.body.appendChild(bubble);
      var pinned=null;
      function callAt(el){return el&&el.closest?el.closest('.endnote-ref'):null;}
      function place(ref){
        var a=ref.getBoundingClientRect();
        var bw=bubble.offsetWidth, bh=bubble.offsetHeight;
        var vw=window.innerWidth, vh=window.innerHeight;
        var centerX=(a.left+a.right)/2;
        bubble.style.left=Math.max(MARGIN,Math.min(centerX-bw/2,vw-bw-MARGIN))+'px';
        bubble.style.top=((a.bottom+GAP+bh<=vh)?(a.bottom+GAP):(a.top-GAP-bh))+'px';
      }
      function show(ref){
        var body=ref.querySelector('.endnote-body');
        bubble.innerHTML=body?body.innerHTML:'';
        bubble.setAttribute('data-visible','true');
        place(ref);
      }
      function hide(){bubble.setAttribute('data-visible','false');}
      // Hover only previews when nothing is pinned; a click-pinned note wins until it is
      // dismissed, so hovering another call can't swap the bubble out from under it.
      document.addEventListener('pointerover',function(e){var ref=callAt(e.target);if(ref&&!pinned)show(ref);});
      document.addEventListener('pointerout',function(e){
        var ref=callAt(e.target);
        if(!ref||pinned)return;
        var to=e.relatedTarget;
        if(!(to&&(callAt(to)===ref||bubble.contains(to))))hide();
      });
      document.addEventListener('focusin',function(e){var ref=callAt(e.target);if(ref)show(ref);});
      document.addEventListener('focusout',function(e){var ref=callAt(e.target);if(ref&&!pinned)hide();});
      document.addEventListener('click',function(e){
        var ref=callAt(e.target);
        if(ref){pinned=(pinned===ref)?null:ref;if(pinned){show(ref);}else{hide();}return;}
        if(!bubble.contains(e.target)){pinned=null;hide();}
      });
      document.addEventListener('keydown',function(e){if(e.key==='Escape'){pinned=null;hide();}});
      })()</script>
      </body></html>`;
  }
}
