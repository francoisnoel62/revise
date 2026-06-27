// ABOUTME: Isolated live editor-preview route proving KDP pagination with the shared renderer.
// ABOUTME: Debounces TipTap edits and reports Paged.js page-count and timing measurements.

'use client';

import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import { PAGED_CHAPTER_FIXTURE } from './fixture';

const renderer = new PagedJsRenderer();
const converter = new TipTapToBookHtml();

interface PaginationMessage {
  readonly type: 'paged-rendered';
  readonly pageCount: number;
  readonly paginationMs: number;
}

export default function PagedSpikePage() {
  const [renderedContent, setRenderedContent] = useState<JSONContent>(PAGED_CHAPTER_FIXTURE);
  const [metrics, setMetrics] = useState({ renderCount: 0, pageCount: 0, paginationMs: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const receiveMetrics = (event: globalThis.MessageEvent<PaginationMessage>) => {
      if (event.data?.type !== 'paged-rendered') return;
      setMetrics((current) => ({
        renderCount: current.renderCount + 1,
        pageCount: event.data.pageCount,
        paginationMs: event.data.paginationMs,
      }));
    };
    window.addEventListener('message', receiveMetrics);
    return () => window.removeEventListener('message', receiveMetrics);
  }, []);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: PAGED_CHAPTER_FIXTURE,
    onUpdate: ({ editor: currentEditor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setRenderedContent(currentEditor.getJSON()), 300);
    },
    editorProps: {
      attributes: {
        class: 'min-h-96 rounded bg-white p-6 font-serif text-slate-900 outline-none',
      },
    },
  });

  const documentHtml = useMemo(() => renderer.render({
    bodyHtml: converter.convert(renderedContent),
    profile: PublicationProfile.kdpSixByNine(),
    assetBaseUrl: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
  }), [renderedContent]);

  if (!editor) return <main className='min-h-screen bg-slate-900' />;

  return (
    <main className='min-h-screen bg-slate-900 p-6 text-white'>
      <header className='mx-auto mb-6 max-w-7xl'>
        <p className='text-sm uppercase tracking-widest text-amber-300'>Spike #122</p>
        <h1 className='text-2xl font-semibold'>Aperçu KDP 6×9</h1>
        <output
          className='text-sm text-slate-300'
          data-page-count={metrics.pageCount}
          data-pagination-ms={metrics.paginationMs}
          data-render-count={metrics.renderCount}
          data-testid='pagination-status'
        >
          {metrics.pageCount} page(s), {metrics.paginationMs.toFixed(1)} ms
        </output>
      </header>
      <div className='mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(600px,1fr)]'>
        <section data-testid='paged-editor'>
          <EditorContent editor={editor} />
        </section>
        <iframe
          className='block h-[920px] w-full border-0'
          data-testid='paged-preview'
          sandbox='allow-same-origin allow-scripts'
          srcDoc={documentHtml}
          title='Aperçu paginé KDP 6×9'
        />
      </div>
    </main>
  );
}
