// ABOUTME: Diagnostic harness — runs the real BookPreviewCacheComputer against synthetic
// ABOUTME: whole-book content (local static server for polyfill/fonts) to re-verify page numbering.
// Usage: `npx tsx scripts/repro-book-preview.mts` then `npx tsx scripts/inspect-pdf-numbering.mts`.
// Paged.js page-counter behaviour is subtle (see BookCssBuilder); keep this to re-check folios/body.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { JSONContent } from '@tiptap/core';
import { BookPreviewCacheComputer } from '@/application/services/BookPreviewCacheComputer';
import { PlaywrightBrowserLauncher } from '@/infrastructure/document/paged/PlaywrightBrowserLauncher';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

const MIME: Record<string, string> = {
  '.js': 'application/javascript',
  '.woff2': 'font/woff2',
  '.css': 'text/css',
};

function staticServer(rootDir: string): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const filePath = path.join(rootDir, decodeURIComponent((req.url ?? '/').split('?')[0]));
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        res.setHeader('Content-Type', MIME[path.extname(filePath)] ?? 'application/octet-stream');
        res.end(data);
      });
    });
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ port, close: () => server.close() });
    });
  });
}

function chapter(n: number, paragraphs: number): { id: string; title: string; content: JSONContent } {
  const content: JSONContent = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: `Chapitre ${n}` }] },
      ...Array.from({ length: paragraphs }, (_, i) => ({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `Paragraphe ${i + 1} du chapitre ${n}. ${'Une phrase de remplissage assez longue pour occuper de la place sur la page. '.repeat(4)}`,
          },
        ],
      })),
    ],
  };
  return { id: `ch-${n}`, title: `Chapitre ${n}`, content };
}

async function main() {
  const { port, close } = await staticServer(path.join(process.cwd(), 'public'));
  const assetBaseUrl = `http://localhost:${port}`;
  console.log(`[repro] static server on ${assetBaseUrl}`);

  const chapters = [chapter(1, 40), chapter(2, 40), chapter(3, 40)];
  const computer = new BookPreviewCacheComputer(new PlaywrightBrowserLauncher());

  const start = Date.now();
  try {
    const { entry, pdf } = await computer.compute({
      projectId: 'repro-proj',
      ownerId: 'repro-owner',
      profile: PublicationProfile.kdpSixByNine(),
      chapters,
      frontMatter: { title: 'Mon Roman de Test', authorName: 'Fanfan', dedicationContent: 'À toi' },
      contentHash: 'repro-hash',
      assetBaseUrl,
    });
    const ms = Date.now() - start;
    console.log(`[repro] ✅ rendered in ${ms} ms`);
    console.log(`[repro] totalPageCount     = ${entry.getTotalPageCount()}`);
    console.log(`[repro] frontMatterPageCount= ${entry.getFrontMatterPageCount()}`);
    console.log(`[repro] chapterOffsets      = ${JSON.stringify(entry.getChapterOffsets())}`);
    const out = path.join(process.env.TEMP ?? '.', 'repro-book-preview.pdf');
    fs.writeFileSync(out, pdf);
    console.log(`[repro] PDF (${pdf.length} bytes) written to ${out}`);
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`[repro] ❌ failed after ${ms} ms:`);
    console.log(err instanceof Error ? err.message : String(err));
  } finally {
    close();
  }
}

main().then(() => process.exit(0));
