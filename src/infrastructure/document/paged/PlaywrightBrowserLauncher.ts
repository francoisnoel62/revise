// ABOUTME: BrowserLauncher adapter wrapping Playwright's Chromium engine.
// ABOUTME: The only file that imports playwright-core; all other code depends on BrowserLauncher.

import { chromium, type LaunchOptions } from 'playwright-core';
import type { BrowserHandle, BrowserLauncher, PageHandle, PdfPrintOptions } from '@/application/interfaces/BrowserLauncher';

// Vercel's serverless functions ship no Chromium binary and have no writable Playwright
// browser cache — `chromium.launch()` fails with "Executable doesn't exist". Launch the
// Lambda-packaged binary from @sparticuz/chromium there instead; everywhere else (local
// dev, CI, e2e) keep using the browser Playwright installed via `npx playwright install`.
async function resolveLaunchOptions(options: { headless: boolean }): Promise<LaunchOptions> {
  if (!process.env.VERCEL) {
    return options;
  }
  const sparticuzChromium = (await import('@sparticuz/chromium')).default;
  return {
    ...options,
    args: sparticuzChromium.args,
    executablePath: await sparticuzChromium.executablePath(),
  };
}

export class PlaywrightBrowserLauncher implements BrowserLauncher {
  async launch(options: { headless: boolean }): Promise<BrowserHandle> {
    const launchOptions = await resolveLaunchOptions(options);
    const browser = await chromium.launch(launchOptions);
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
