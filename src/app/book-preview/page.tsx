// ABOUTME: Whole-book preview page — read-only paginated view of the complete manuscript.
// ABOUTME: Renders front matter, TOC, and all chapters via the shared PagedJsRenderer.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { JSONContent } from '@tiptap/core';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBookPreviewDataAction, type BookPreviewData } from '@/app/actions/book-preview-actions';
import { WholeBookHtmlAssembler } from '@/application/services/WholeBookHtmlAssembler';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

const renderer = new PagedJsRenderer();
const converter = new TipTapToBookHtml();
const assembler = new WholeBookHtmlAssembler(converter);

interface RenderMetrics {
  readonly pageCount: number;
  readonly paginationMs: number;
}

/** Matches the 30s budget PagedPdfExporter already grants Paged.js server-side. */
const RENDER_TIMEOUT_MS = 30_000;

function BookPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const [data, setData] = useState<BookPreviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RenderMetrics | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderTimedOut, setRenderTimedOut] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!projectId) {
      router.replace('/dashboard');
      return;
    }

    getBookPreviewDataAction(projectId).then((result) => {
      if (!result.success) {
        setLoadError(result.error ?? 'Erreur de chargement');
      } else {
        setData(result.data);
        setIsRendering(true);
      }
    });
  }, [projectId, router]);

  // Guards against a stuck or failed Paged.js render: without this, a render that
  // never posts 'paged-rendered' leaves the author staring at an infinite spinner
  // with no way to tell a slow render from a broken one.
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => setRenderTimedOut(true), RENDER_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [data, retryToken]);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type !== 'paged-rendered') return;
    if (event.source !== iframeRef.current?.contentWindow) return;
    setMetrics({ pageCount: event.data.pageCount as number, paginationMs: event.data.paginationMs as number });
    setIsRendering(false);
    setRenderTimedOut(false);
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const retryRender = useCallback(() => {
    setIsRendering(true);
    setRenderTimedOut(false);
    setMetrics(null);
    setRetryToken((token) => token + 1);
  }, []);

  const documentHtml = useMemo(() => {
    if (!data) return null;
    const chapters = data.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      content: JSON.parse(ch.content) as JSONContent,
    }));
    const { bodyHtml, tocEntries } = assembler.assemble(chapters);
    const profile = PublicationProfile.fromId(data.profileId);
    return renderer.render({
      bodyHtml,
      profile,
      assetBaseUrl: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
      frontMatter: data.frontMatter,
      toc: tocEntries.length > 0 ? [...tocEntries] : undefined,
    });
  }, [data]);

  const navigateToChapter = useCallback((chapterId: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'navigate-to-chapter', chapterId },
      '*',
    );
  }, []);

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{loadError}</p>
          <Link href="/dashboard">
            <Button variant="outline">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          {projectId && (
            <Link href={`/editor?project=${projectId}`}>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h1 className="text-lg font-semibold text-white">
              {data?.projectTitle ?? 'Aperçu livre entier'}
            </h1>
          </div>
        </div>
        <div className="text-sm text-slate-400" data-testid="book-preview-status">
          {isRendering && data && renderTimedOut && (
            <span className="flex items-center gap-3 text-amber-400" data-testid="book-preview-error">
              Le rendu a pris trop de temps.
              <Button variant="outline" size="sm" onClick={retryRender}>
                Réessayer
              </Button>
            </span>
          )}
          {isRendering && data && !renderTimedOut && (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pagination en cours…
            </span>
          )}
          {!isRendering && metrics && (
            <span data-page-count={metrics.pageCount} data-pagination-ms={metrics.paginationMs}>
              {metrics.pageCount} pages · {metrics.paginationMs.toFixed(0)} ms
            </span>
          )}
          {!data && !loadError && (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </span>
          )}
        </div>
      </header>

      {/* Body: sidebar + iframe */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chapter navigation sidebar */}
        <aside
          className="w-56 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-800 p-4"
          data-testid="chapter-navigation"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Chapitres
          </p>
          {data ? (
            <nav>
              <ul className="space-y-1">
                {data.chapters.map((ch) => (
                  <li key={ch.id}>
                    <button
                      className="w-full rounded px-2 py-1.5 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                      data-chapter-id={ch.id}
                      onClick={() => navigateToChapter(ch.id)}
                    >
                      {ch.title || 'Sans titre'}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <p className="text-sm text-slate-500">Chargement…</p>
          )}
        </aside>

        {/* Paged.js iframe */}
        <main className="relative flex-1 overflow-hidden bg-slate-900">
          {documentHtml ? (
            <iframe
              key={retryToken}
              ref={iframeRef}
              className="h-full w-full border-0"
              data-testid="book-preview-iframe"
              sandbox="allow-same-origin allow-scripts"
              srcDoc={documentHtml}
              title="Aperçu livre entier"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function BookPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <BookPreviewContent />
    </Suspense>
  );
}
