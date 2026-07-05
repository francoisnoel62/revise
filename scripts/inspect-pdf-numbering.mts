// ABOUTME: Diagnostic — prints the bottom-most text run (the footer page number) per PDF page.
// ABOUTME: Pairs with repro-book-preview.mts to re-verify liminal (roman) + body (Arabic) numbering.
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function main() {
  const pdfPath = path.join(process.env.TEMP ?? '.', 'repro-book-preview.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data }).promise;
  console.log(`[inspect] ${doc.numPages} pages in ${pdfPath}`);

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items.filter((i: any) => i.str && i.str.trim());
    if (items.length === 0) {
      console.log(`page ${p}: (empty)`);
      continue;
    }
    const bottom = items.reduce((min: any, i: any) => (i.transform[5] < min.transform[5] ? i : min), items[0]);
    console.log(`page ${p}: footer = "${(bottom as any).str.trim()}"`);
  }
}

main().then(() => process.exit(0));
