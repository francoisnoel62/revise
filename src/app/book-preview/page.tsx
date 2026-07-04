// ABOUTME: Whole-book preview page — displays the real export PDF (server-generated, cached) in a viewer.
// ABOUTME: Lazy generation with a spinner; sidebar jumps to chapters via the PDF #page=N anchor.

'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getBookPreviewDataAction,
  type BookPreviewData,
  type BookPreviewProfileId,
} from '@/app/actions/book-preview-actions';

const PROFILE_LABELS: Record<BookPreviewProfileId, string> = {
  'kdp-6x9': 'KDP 6×9',
  a5: 'A5',
};

/** Generating a 300-page PDF in Chromium can take several seconds; guard against a stuck render. */
const GENERATION_TIMEOUT_MS = 60_000;

function BookPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  const [data, setData] = useState<BookPreviewData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BookPreviewProfileId | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Resets that mark "a new request is starting" live in the event handlers below
  // (selectProfile / retry); the initial request relies on the default state. The
  // effect only mutates state from async callbacks and the timeout — never synchronously.
  useEffect(() => {
    if (!projectId) {
      router.replace('/dashboard');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setTimedOut(true);
    }, GENERATION_TIMEOUT_MS);

    getBookPreviewDataAction(projectId, selectedProfile ?? undefined)
      .then((result) => {
        if (cancelled) return;
        if (!result.success) {
          setLoadError(result.error ?? 'Erreur de chargement');
        } else {
          setData(result.data);
        }
        setIsGenerating(false);
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projectId, selectedProfile, router, retryToken]);

  const selectProfile = useCallback((profile: BookPreviewProfileId) => {
    setSelectedProfile(profile);
    setIsGenerating(true);
    setTimedOut(false);
    setLoadError(null);
    setPdfPage(1);
  }, []);

  const retry = useCallback(() => {
    setRetryToken((token) => token + 1);
    setIsGenerating(true);
    setTimedOut(false);
    setLoadError(null);
  }, []);

  const pdfSrc =
    projectId && data && !data.isPasserelle
      ? `/api/book-preview/pdf?project=${encodeURIComponent(projectId)}&profile=${data.profileId}#page=${pdfPage}`
      : null;

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="mb-4 text-red-400">{loadError}</p>
          <Link href="/dashboard">
            <Button variant="outline">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-900">
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

        <div className="flex items-center gap-4">
          {/* Preview-only profile selector — does NOT change the project's active profile */}
          {data && !data.isPasserelle && (
            <div className="flex items-center gap-1" data-testid="preview-profile-selector">
              {data.availableProfiles.map((profile) => (
                <button
                  key={profile}
                  data-profile={profile}
                  aria-pressed={data.profileId === profile}
                  onClick={() => selectProfile(profile)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    data.profileId === profile
                      ? 'bg-amber-500 text-slate-900'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {PROFILE_LABELS[profile]}
                </button>
              ))}
            </div>
          )}
          <div className="text-sm text-slate-400" data-testid="book-preview-status">
            {isGenerating && timedOut && (
              <span className="flex items-center gap-3 text-amber-400" data-testid="book-preview-error">
                La génération a pris trop de temps.
                <Button variant="outline" size="sm" onClick={retry}>
                  Réessayer
                </Button>
              </span>
            )}
            {isGenerating && !timedOut && (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération en cours…
              </span>
            )}
            {!isGenerating && data && !data.isPasserelle && (
              <span data-page-count={data.totalPageCount}>{data.totalPageCount} pages</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="w-56 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-800 p-4"
          data-testid="chapter-navigation"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Chapitres
          </p>
          {data && !data.isPasserelle ? (
            <nav>
              <ul className="space-y-1">
                {data.chapters.map((ch) => (
                  <li key={ch.id}>
                    <button
                      className="w-full rounded px-2 py-1.5 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                      data-chapter-id={ch.id}
                      data-page-number={ch.pageNumber}
                      onClick={() => setPdfPage(ch.pageNumber)}
                    >
                      {ch.title || 'Sans titre'}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <p className="text-sm text-slate-500">
              {data?.isPasserelle ? 'Indisponible' : 'Chargement…'}
            </p>
          )}
        </aside>

        <main className="relative flex-1 overflow-hidden bg-slate-900">
          {data?.isPasserelle ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <p className="mb-2 text-slate-300">
                  L&apos;aperçu livre entier n&apos;est pas disponible pour le profil{' '}
                  <span className="font-semibold">passerelle</span>.
                </p>
                <p className="text-sm text-slate-500">
                  Ce profil sert au partage (Google Docs / DOCX), sans mise en page paginée.
                </p>
              </div>
            </div>
          ) : pdfSrc ? (
            <iframe
              key={`${data?.profileId}-${retryToken}`}
              ref={iframeRef}
              className="h-full w-full border-0 bg-slate-200"
              data-testid="book-preview-pdf"
              src={pdfSrc}
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
