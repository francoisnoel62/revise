// ABOUTME: End-to-end proof that the paged preview and exported PDF share page geometry.
// ABOUTME: Rasterizes the first PDF page and compares it with the browser preview page.

import { expect, test } from '@playwright/test';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { PAGED_CHAPTER_FIXTURE } from '../../src/app/editor/paged-spike/fixture';

test('the KDP preview and PDF export share the same paged rendering', async ({ page, request }) => {
  await page.goto('/editor/paged-spike');

  const previewFrame = page.frameLocator('[data-testid=paged-preview]');
  const previewPage = previewFrame.locator('.pagedjs_page').first();
  await expect(previewPage).toBeVisible();
  await page.evaluate(() => Array.from(document.body.children).forEach((element) => {
    if (element.tagName !== 'MAIN' && element.tagName !== 'SCRIPT') element.remove();
  }));
  const previewPng = PNG.sync.read(await previewPage.screenshot());

  const response = await request.post('/api/paged-spike/export', {
    data: { content: PAGED_CHAPTER_FIXTURE },
  });
  expect(response.ok()).toBe(true);

  const pdf = await getDocument({ data: new Uint8Array(await response.body()) }).promise;
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
    // Screen ClearType and PDF.js grayscale glyph rasterization differ. A high
    // per-pixel threshold still catches black/white geometry displacement.
    { threshold: 0.8 }
  );
  const mismatchRatio = mismatchedPixels / (previewPng.width * previewPng.height);
  expect(mismatchRatio).toBeLessThan(0.01);
});
