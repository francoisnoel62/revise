// ABOUTME: End-to-end proof that PagedPdfExporter output matches the paged preview.
// ABOUTME: Extends the spike parity test to the real production export path.

import { expect, test } from '@playwright/test';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Chapter } from '../../src/domain/entities/Chapter';
import { PagedPdfExporter } from '../../src/infrastructure/document/exporters/PagedPdfExporter';
import { PlaywrightBrowserLauncher } from '../../src/infrastructure/document/paged/PlaywrightBrowserLauncher';
import { PAGED_CHAPTER_FIXTURE } from '../../src/app/editor/paged-spike/fixture';

test.setTimeout(120_000);

test('PagedPdfExporter produces a PDF matching the paged preview', async ({ page }) => {
  await page.goto('/editor/paged-spike');

  const previewFrame = page.frameLocator('[data-testid=paged-preview]');
  const previewPage = previewFrame.locator('.pagedjs_page').first();
  await expect(previewPage).toBeVisible();
  await page.evaluate(() => Array.from(document.body.children).forEach((el) => {
    if (el.tagName !== 'MAIN' && el.tagName !== 'SCRIPT') el.remove();
  }));
  const previewPng = PNG.sync.read(await previewPage.screenshot());

  const chapter = new Chapter(
    'ch-fixture',
    'Chapitre premier',
    JSON.stringify(PAGED_CHAPTER_FIXTURE),
    0
  );
  const exporter = new PagedPdfExporter('http://localhost:3000', new PlaywrightBrowserLauncher());
  const buffer = await exporter.exportChapters([chapter], 'fixture.pdf');

  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pdfPage = await pdf.getPage(1);
  const viewport = pdfPage.getViewport({ scale: 96 / 72 });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  await pdfPage.render({
    canvas,
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise;

  const pdfPng = PNG.sync.read(canvas.toBuffer('image/png'));
  expect([pdfPng.width, pdfPng.height]).toEqual([previewPng.width, previewPng.height]);

  const mismatchedPixels = pixelmatch(
    previewPng.data,
    pdfPng.data,
    null,
    previewPng.width,
    previewPng.height,
    // Screen ClearType and PDF.js grayscale glyph rasterization differ.
    // A high per-pixel threshold still catches black/white geometry displacement.
    { threshold: 0.8 }
  );
  const mismatchRatio = mismatchedPixels / (previewPng.width * previewPng.height);
  expect(mismatchRatio).toBeLessThan(0.01);
});
