// ABOUTME: Interface for headless browser lifecycle used by the PDF export pipeline.
// ABOUTME: Decouples export logic from the specific browser automation library.

export interface PdfPrintOptions {
  preferCSSPageSize?: boolean;
  printBackground?: boolean;
  width?: string;
  height?: string;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
}

export interface PageHandle {
  setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
  waitForFunction(fn: () => boolean, options?: { timeout?: number }): Promise<void>;
  pdf(options?: PdfPrintOptions): Promise<Buffer>;
  /** Run a function in the page context and return its serializable result. */
  evaluate<T>(fn: () => T): Promise<T>;
}

export interface BrowserHandle {
  newPage(options?: { viewport?: { width: number; height: number } }): Promise<PageHandle>;
  close(): Promise<void>;
}

export interface BrowserLauncher {
  launch(options: { headless: boolean }): Promise<BrowserHandle>;
}
