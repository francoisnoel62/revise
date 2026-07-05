// ABOUTME: BrowserLauncher adapter wrapping Playwright's Chromium engine.
// ABOUTME: The only file that imports @playwright/test; all other code depends on BrowserLauncher.

import { chromium } from '@playwright/test';
import type { BrowserHandle, BrowserLauncher, PageHandle, PdfPrintOptions } from './BrowserLauncher';

export class PlaywrightBrowserLauncher implements BrowserLauncher {
  async launch(options: { headless: boolean }): Promise<BrowserHandle> {
    const browser = await chromium.launch(options);
    return {
      newPage: async (pageOptions) => {
        const page = await browser.newPage(pageOptions);
        const handle: PageHandle = {
          setContent: (html, opts) =>
            page.setContent(html, opts as { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' }),
          waitForFunction: async (fn, opts) => {
            await page.waitForFunction(fn as () => unknown, opts);
          },
          pdf: (opts?: PdfPrintOptions) => page.pdf(opts),
          evaluate: <T>(pageFunction: string | (() => T)) =>
            page.evaluate(pageFunction as string) as Promise<T>,
        };
        return handle;
      },
      close: () => browser.close(),
    };
  }
}
