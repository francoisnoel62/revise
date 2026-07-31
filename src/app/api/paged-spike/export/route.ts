// ABOUTME: Spike-only PDF endpoint rendering TipTap content through the shared Paged.js document.
// ABOUTME: Uses Chromium print output while leaving the production pdf-lib exporter unchanged.

import type { JSONContent } from '@tiptap/core';
import { chromium } from '@playwright/test';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { createServerPagedJsRenderer } from '@/infrastructure/document/paged/ServerPagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExportRequest {
  readonly content?: JSONContent;
}

export async function POST(request: globalThis.Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const payload = await request.json() as ExportRequest;
  if (!payload.content) {
    return Response.json({ error: 'TipTap content is required' }, { status: 400 });
  }

  const converter = new TipTapToBookHtml();
  const renderer = createServerPagedJsRenderer();
  const html = renderer.render({
    bodyHtml: converter.convert(payload.content),
    profile: PublicationProfile.kdpSixByNine(),
    assetBaseUrl: new URL(request.url).origin,
  });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 576, height: 864 } });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.pagedReady === 'true');
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      width: '6in',
      height: '9in',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename=paged-spike-kdp.pdf',
      },
    });
  } finally {
    await browser.close();
  }
}
