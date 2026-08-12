// ABOUTME: Builds the Paged.js renderer used inside server-side Chromium PDF generation.
// ABOUTME: Embeds the vendored bundle so production rendering never performs a self-HTTP request.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PagedJsRenderer } from './PagedJsRenderer';

const PAGED_JS_PATH = path.join(process.cwd(), 'public', 'vendor', 'paged.polyfill.min.js');

let cachedSource: string | undefined;

export function loadPagedJsSource(): string {
  if (cachedSource !== undefined) return cachedSource;

  const source = readFileSync(PAGED_JS_PATH, 'utf8');
  if (!source.includes('PagedPolyfill')) {
    throw new Error(`Bundled Paged.js is invalid: ${PAGED_JS_PATH}`);
  }

  // Keep the generated HTML valid even if a future Paged.js release contains this sequence.
  cachedSource = source.replace(/<\/script/gi, '<\\/script');
  return cachedSource;
}

export function createServerPagedJsRenderer(): PagedJsRenderer {
  return new PagedJsRenderer({ pagedJsSource: loadPagedJsSource() });
}
