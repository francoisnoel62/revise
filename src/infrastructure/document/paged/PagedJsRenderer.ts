// ABOUTME: Single Paged.js renderer shared by browser preview and Chromium export.
// ABOUTME: Produces one deterministic document and exposes pagination metrics.

import type { PagedRenderer, PagedRenderRequest } from '@/application/interfaces/PagedRenderer';
import { BackMatterHtmlBuilder } from './BackMatterHtmlBuilder';
import { BookCssBuilder } from './BookCssBuilder';
import { EndnotesHtmlBuilder } from './EndnotesHtmlBuilder';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import { TocHtmlBuilder } from './TocHtmlBuilder';

export interface PagedJsRendererOptions {
  /**
   * A trusted Paged.js bundle to embed in the generated document. Server-side PDF rendering
   * supplies this so Chromium does not need an HTTP request back to the deployed application.
   */
  readonly pagedJsSource?: string;
}

export class PagedJsRenderer implements PagedRenderer {
  constructor(
    private readonly options: PagedJsRendererOptions = {},
    private readonly cssBuilder = new BookCssBuilder(),
    private readonly frontMatterBuilder = new FrontMatterHtmlBuilder(new TipTapToBookHtml()),
    private readonly tocBuilder = new TocHtmlBuilder(),
    private readonly backMatterBuilder = new BackMatterHtmlBuilder(new TipTapToBookHtml()),
    private readonly endnotesBuilder = new EndnotesHtmlBuilder(new TipTapToBookHtml()),
  ) {}

  render(request: PagedRenderRequest): string {
    const assets = request.assetBaseUrl.replace(/\/$/, '');
    const pagedJsScript = this.options.pagedJsSource
      ? `<script>${this.options.pagedJsSource}</script>`
      : `<script src='${assets}/vendor/paged.polyfill.min.js'></script>`;

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

    // Folios are resolved from Paged.js's physical page boxes after pagination, so body blank
    // versos count while liminaire blank versos remain outside Arabic numbering.
    const css = this.cssBuilder.build(
      request.profile,
      assets,
      request.startPageNumber,
      request.levelStyles,
      request.honorBlankLines,
    );
    const bodyStartPageNumber = request.startPageNumber && request.startPageNumber > 0
      ? Math.floor(request.startPageNumber)
      : 1;

    // Endnotes are back matter: after the body, before the legal-notice colophon (the last page).
    const fullBodyHtml = hasExtras
      ? `${frontMatterHtml}\n${tocHtml}\n<div class="body-matter">${request.bodyHtml}</div>\n${endnotesHtml}\n${backMatterHtml}`
      : request.bodyHtml;

    return `<!doctype html><html lang='fr'><head><meta charset='utf-8'>
      <style>${css}</style>
      <script>window.PagedConfig={auto:false}</script>
      ${pagedJsScript}
      </head><body><main class='book'>${fullBodyHtml}</main>
      <script>(async()=>{
      try{
      if(!window.PagedPolyfill){throw new Error('PagedPolyfill non chargé ('+${JSON.stringify(`${assets}/vendor/paged.polyfill.min.js`)}+')');}
      await document.fonts.ready;const start=performance.now();
      const flow=await window.PagedPolyfill.preview();
      // Paged.js exposes the physical page boxes only after pagination. Resolve folios from
      // those boxes rather than its global CSS page counter: that counter cannot distinguish a
      // front-matter blank verso (outside Arabic pagination) from a body blank verso (which must
      // advance the next Arabic page). The same pass also keeps classic-TOC references aligned.
      (function resolveBookFolios(bodyStart){
        var pages=Array.prototype.slice.call(document.querySelectorAll('.pagedjs_pages .pagedjs_page'));
        var firstBody=-1;
        var halfTitle=-1;
        var targets={};
        for(var i=0;i<pages.length;i++){
          if(firstBody===-1&&pages[i].querySelector('section.chapter[id]'))firstBody=i;
          if(halfTitle===-1&&pages[i].querySelector('.half-title'))halfTitle=i;
          var ids=pages[i].querySelectorAll('[id]');
          for(var j=0;j<ids.length;j++){
            var id=ids[j].id;
            if(id&&!Object.prototype.hasOwnProperty.call(targets,id))targets[id]=i;
          }
        }
        if(firstBody===-1)return;
        function footer(page){return page.querySelector('.pagedjs_margin-bottom-center');}
        function writeFooter(slot,text){
          var content=slot.querySelector('.pagedjs_margin-content');
          if(!content)return;
          content.textContent=text;
          slot.classList.toggle('hasContent',Boolean(text));
        }
        function roman(value){
          var pairs=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
          var result='';
          for(var n=0;n<pairs.length;n++)while(value>=pairs[n][0]){result+=pairs[n][1];value-=pairs[n][0];}
          return result;
        }
        var liminalFolio=0;
        for(var pageIndex=0;pageIndex<pages.length;pageIndex++){
          var page=pages[pageIndex];
          var margin=footer(page);
          if(!margin)continue;
          writeFooter(margin,'');
          if(page.classList.contains('pagedjs_blank_page'))continue;
          if(pageIndex<firstBody){
            if(pageIndex!==halfTitle){liminalFolio++;writeFooter(margin,roman(liminalFolio));}
            continue;
          }
          if(!page.querySelector('.colophon'))writeFooter(margin,String(bodyStart+pageIndex-firstBody));
        }
        var tocLinks=document.querySelectorAll('.toc a[href^="#"]');
        for(var linkIndex=0;linkIndex<tocLinks.length;linkIndex++){
          var link=tocLinks[linkIndex];
          var targetId=link.getAttribute('href').slice(1);
          var targetPage=targets[targetId];
          if(typeof targetPage==='number'&&targetPage>=firstBody){
            link.setAttribute('data-resolved-page',String(bodyStart+targetPage-firstBody));
          }
        }
      })(${JSON.stringify(bodyStartPageNumber)});
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
      // Paged.js rebuilds the preview DOM asynchronously (PagedPolyfill.preview); listeners wired
      // before that finishes never fire on the paginated pages, so init() waits until a page exists.
      var MARGIN=8, GAP=6;
      function init(){
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
      }
      if(document.querySelector('.pagedjs_page')){init();}
      else{var obs=new MutationObserver(function(){if(document.querySelector('.pagedjs_page')){obs.disconnect();init();}});obs.observe(document.documentElement,{childList:true,subtree:true});}
      })()</script>
      </body></html>`;
  }
}
