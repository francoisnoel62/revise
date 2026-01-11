# PDF Import Feature - Implementation Plan

> **Status**: Planned
> **Author**: Claude
> **Date**: January 2026

## Executive Summary

This plan details how to add PDF import functionality to Revise. The implementation follows Clean Architecture principles, introduces a `PdfParser` implementing the existing `DocumentParser` interface, and adds a `CompositeDocumentParser` to handle multiple formats transparently.

---

## 1. Technical Analysis of PDF Parsing Options

### 1.1 Library Comparison

| Library | Text Extraction | Formatting | Chapter Detection | Bundle Size | Maintenance | TypeScript |
|---------|-----------------|------------|-------------------|-------------|-------------|------------|
| **unpdf** ⭐ | Excellent | Via fontName | Via PDF.js API | Small (serverless) | Active (UnJS) | Native |
| **pdfjs-dist** | Excellent | fontName only | Outline API | ~3MB | Mozilla | @types |
| **pdf2json** | Good | Bold/Italic flags | Via font size | ~800KB | Active | @types |
| **pdf-parse** | Good | None | None | Small | Unmaintained | @types |

### 1.2 Recommended Library: unpdf

**Justification:**
- Modern TypeScript-first API
- Zero dependencies (bundles PDF.js v5.4.394)
- Serverless-optimized (important for Next.js)
- Maintained by UnJS (Nuxt/Nitro team)
- Simple async/await API aligns with existing patterns
- `getResolvedPDFJS()` provides low-level PDF.js access for outline extraction

**Installation:**
```bash
npm install unpdf
```

---

## 2. Formatting Preservation

### 2.1 What CAN Be Preserved

| Feature | Detection Method | TipTap Mapping |
|---------|------------------|----------------|
| **Bold** | fontName contains "Bold"/"Black" | `marks: [{ type: 'bold' }]` |
| **Italic** | fontName contains "Italic"/"Oblique" | `marks: [{ type: 'italic' }]` |
| **Font Family** | fontName base (e.g., "Arial") | `textStyle.fontFamily` |
| **Font Size** | fontSize from text item | `textStyle.fontSize` |
| **Headings** | Large font + single line | `heading` with level 1-3 |
| **Paragraphs** | Text blocks separated by vertical gaps | `paragraph` |

### 2.2 What CANNOT Be Preserved

| Feature | Reason | Fallback |
|---------|--------|----------|
| **Underline** | PDF renders as line, not text attribute | Skip |
| **Highlight** | Not stored in PDF structure | Skip |
| **Lists** | No semantic structure in PDF | Plain paragraphs |
| **Text Alignment** | Position-based, complex to infer | Default (justify) |
| **Tables** | Complex layout reconstruction | Plain text |
| **Images** | Out of scope for text import | Skip |

### 2.3 Scanned PDFs

**Important Limitation:** This implementation only handles text-based PDFs. Scanned PDFs (images) require OCR, which is out of scope.

The parser will:
1. Detect if PDF has extractable text
2. Return error if no text found: *"Ce PDF semble être scanné. Seuls les PDFs textuels sont supportés."*

---

## 3. Chapter Detection Strategy

### 3.1 Detection Priority

```
1. PDF Bookmarks/Outline ─────────────── Highest Priority
   │  Use pdf.getOutline() from PDF.js
   │  Works when PDF has embedded TOC
   │
   ▼ (if not available)

2. Large Font Detection ──────────────── Medium Priority
   │  Font size > 150% of median body text
   │  Line is short (< 100 characters)
   │  Starts with capital letter
   │
   ▼ (if no headings detected)

3. Word Limit Fallback ───────────────── Fallback (NEW)
   │  Split into chunks of max 5000 words
   │  Cut at natural breaks (paragraphs, sentences)
   │  Name chapters "Partie 1", "Partie 2", etc.
```

### 3.2 Word Limit Fallback Algorithm

When chapter detection fails, instead of creating a single potentially huge chapter, automatically split the document into manageable chunks:

```typescript
const MAX_WORDS_PER_CHAPTER = 5000;

function splitByWordLimit(pages: PdfTextPage[]): ChapterBoundary[] {
  const allItems = pages.flatMap(p => p.items);
  const totalWords = countWords(allItems);

  // If document is short enough, single chapter
  if (totalWords <= MAX_WORDS_PER_CHAPTER) {
    return [{ title: '', items: allItems }];
  }

  // Smart splitting
  const chapters: ChapterBoundary[] = [];
  let currentChapter: PdfTextItem[] = [];
  let currentWordCount = 0;
  let chapterIndex = 1;

  for (const item of allItems) {
    const itemWords = countWords([item]);

    // If adding this item exceeds the limit
    if (currentWordCount + itemWords > MAX_WORDS_PER_CHAPTER && currentChapter.length > 0) {
      // Find natural break point (end of paragraph)
      const splitPoint = findNaturalBreak(currentChapter);

      chapters.push({
        title: `Partie ${chapterIndex}`,
        items: currentChapter.slice(0, splitPoint),
      });

      // Carry over remainder to next chapter
      currentChapter = [...currentChapter.slice(splitPoint), item];
      currentWordCount = countWords(currentChapter);
      chapterIndex++;
    } else {
      currentChapter.push(item);
      currentWordCount += itemWords;
    }
  }

  // Last chapter
  if (currentChapter.length > 0) {
    chapters.push({
      title: `Partie ${chapterIndex}`,
      items: currentChapter,
    });
  }

  return chapters;
}
```

### 3.3 Natural Break Points (Priority)

| Priority | Break Type | Detection |
|----------|------------|-----------|
| 1 | End of paragraph | Large vertical gap between items |
| 2 | End of sentence | Text ends with `.` `!` `?` |
| 3 | End of clause | Text ends with `,` `;` `:` |
| 4 | Any space | Between two words (last resort) |

### 3.4 Chapter Naming

| Case | Generated Title |
|------|-----------------|
| Detection succeeded | Title extracted from PDF |
| Word limit fallback | `Partie 1`, `Partie 2`, ... |

**Benefits of 5000-word limit:**
- **Editor performance**: Reasonable chapter sizes
- **Navigation**: Users can orient by parts
- **Editing**: Easy to rename "Partie X" to real titles after import
- **Auto-save**: Less data to save per chapter

---

## 4. Architecture Design

### 4.1 New Components

```
src/infrastructure/document/
├── parsers/
│   ├── DocxParser.ts              # Existing
│   ├── PdfParser.ts               # NEW - implements DocumentParser
│   ├── PdfParser.test.ts          # NEW - unit tests
│   ├── CompositeParser.ts         # NEW - routes to appropriate parser
│   └── CompositeParser.test.ts    # NEW - unit tests
└── utils/
    ├── tiptap-conversion.ts       # Existing
    ├── pdf-text-extraction.ts     # NEW - PDF.js text extraction
    ├── pdf-text-extraction.test.ts
    ├── pdf-formatting.ts          # NEW - Font → TipTap mapping
    ├── pdf-formatting.test.ts
    ├── pdf-chapter-detection.ts   # NEW - Chapter splitting strategies
    └── pdf-chapter-detection.test.ts
```

### 4.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Interface Layer                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │            CreateProjectDialog.tsx                       │   │
│   │            accept=".docx,.pdf"                          │   │
│   └──────────────────────┬──────────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │            ImportProjectUseCase                          │   │
│   │            (no changes needed)                           │   │
│   └──────────────────────┬──────────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              CompositeDocumentParser                     │   │
│   │              implements DocumentParser                   │   │
│   │  ┌─────────────────┬─────────────────────────────────┐  │   │
│   │  │                 │                                  │  │   │
│   │  ▼                 ▼                                  │  │   │
│   │  DocxParser        PdfParser                          │  │   │
│   │  (.docx)           (.pdf)                             │  │   │
│   │                    │                                  │  │   │
│   │                    ├── pdf-text-extraction.ts         │  │   │
│   │                    ├── pdf-formatting.ts              │  │   │
│   │                    └── pdf-chapter-detection.ts       │  │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Class Interfaces

```typescript
// PdfParser.ts
class PdfParser implements DocumentParser {
  supports(filename: string): boolean;
  parse(buffer: Buffer, filename: string): Promise<string>;
  parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]>;
}

// CompositeDocumentParser.ts
class CompositeDocumentParser implements DocumentParser {
  constructor(parsers: DocumentParser[]);
  supports(filename: string): boolean;
  parse(buffer: Buffer, filename: string): Promise<string>;
  parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]>;
}
```

---

## 5. Implementation Plan

### Phase 1: Foundation (2 days)

**Task 1.1: Install unpdf**
```bash
npm install unpdf
```

**Task 1.2: Create PDF Text Extraction Utilities**
- File: `src/infrastructure/document/utils/pdf-text-extraction.ts`
- Functions:
  - `extractPdfText(buffer: Buffer): Promise<PdfTextPage[]>`
  - `getPdfOutline(buffer: Buffer): Promise<PdfOutlineItem[]>`
  - `isPdfScanned(buffer: Buffer): Promise<boolean>`

**Task 1.3: Unit Tests for Text Extraction**
- Extract text from simple PDF
- Extract text from multi-page PDF
- Detect scanned PDF (no text)
- Handle corrupted PDF
- Extract PDF outline/bookmarks

### Phase 2: Formatting Mapping (2 days)

**Task 2.1: Create Formatting Utilities**
- File: `src/infrastructure/document/utils/pdf-formatting.ts`
- Functions:
  - `parseFontName(fontName: string): FontInfo`
  - `fontInfoToMarks(fontInfo: FontInfo): TipTapMark[]`
  - `fontSizeToHeadingLevel(fontSize: number, baseSize: number): number | null`

**Font name parsing logic:**
```typescript
// "BCDEF+Arial-BoldItalic" → { bold: true, italic: true, family: "Arial" }
function parseFontName(fontName: string): FontInfo {
  const normalized = fontName.replace(/^[A-Z]+\+/, ''); // Remove subset prefix
  return {
    bold: /Bold|Black/i.test(normalized),
    italic: /Italic|Oblique/i.test(normalized),
    family: normalized.replace(/-(Bold|Italic|BoldItalic|Regular|Black|Oblique)*/gi, '')
  };
}
```

**Task 2.2: Unit Tests for Formatting**
- Parse bold from font name
- Parse italic from font name
- Parse bold-italic combination
- Extract font family
- Detect headings from large fonts

### Phase 3: Chapter Detection (2 days)

**Task 3.1: Create Chapter Detection Utilities**
- File: `src/infrastructure/document/utils/pdf-chapter-detection.ts`
- Functions:
  - `detectChaptersFromOutline(outline, pages): ChapterBoundary[]`
  - `detectChaptersFromFontSize(pages): ChapterBoundary[]`
  - `splitByWordLimit(pages, maxWords): ChapterBoundary[]`
  - `findNaturalBreak(items): number`

**Task 3.2: Unit Tests for Chapter Detection**
- Detect chapters from PDF outline
- Detect chapters from font size changes
- Split long document by word limit
- Find natural break at paragraph end
- Find natural break at sentence end
- Handle document shorter than limit

### Phase 4: PdfParser Implementation (2 days)

**Task 4.1: Create PdfParser Class**
- File: `src/infrastructure/document/parsers/PdfParser.ts`

```typescript
// ABOUTME: PDF document parser implementing DocumentParser interface
// ABOUTME: Extracts text with formatting and splits into chapters

export class PdfParser implements DocumentParser {
  supports(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    // 1. Check if PDF has extractable text
    if (await isPdfScanned(buffer)) {
      throw new Error('Ce PDF semble être scanné. Seuls les PDFs textuels sont supportés.');
    }

    // 2. Extract text with formatting
    const pages = await extractPdfText(buffer);

    // 3. Detect chapter boundaries (3-tier strategy)
    let chapters = await detectChaptersFromOutline(buffer, pages);
    if (chapters.length === 0) {
      chapters = detectChaptersFromFontSize(pages);
    }
    if (chapters.length === 0) {
      chapters = splitByWordLimit(pages, 5000);
    }

    // 4. Convert each chapter to TipTap JSON
    // 5. Create Chapter entities
  }
}
```

**Task 4.2: Unit Tests for PdfParser**
- `supports()` returns true for .pdf files
- `supports()` returns false for non-.pdf files
- `parseToChapters()` creates chapters
- `parseToChapters()` preserves bold formatting
- `parseToChapters()` preserves italic formatting
- `parseToChapters()` detects headings
- `parseToChapters()` splits by word limit when no chapters detected
- Throws error for scanned PDFs
- Throws error for corrupted PDFs

### Phase 5: CompositeParser & Integration (2 days)

**Task 5.1: Create CompositeDocumentParser**
- File: `src/infrastructure/document/parsers/CompositeParser.ts`

```typescript
// ABOUTME: Routes document parsing to appropriate parser based on file extension
// ABOUTME: Enables transparent multi-format support without changing use cases

export class CompositeDocumentParser implements DocumentParser {
  constructor(private readonly parsers: DocumentParser[]) {}

  supports(filename: string): boolean {
    return this.parsers.some(p => p.supports(filename));
  }

  async parseToChapters(buffer: Buffer, filename: string): Promise<Chapter[]> {
    const parser = this.parsers.find(p => p.supports(filename));
    if (!parser) {
      throw new Error(`Format de fichier non supporté: ${filename}`);
    }
    return parser.parseToChapters(buffer, filename);
  }
}
```

**Task 5.2: Update Dependency Injection**
- Modify: `src/infrastructure/config/providers.ts`

```typescript
export function getDocumentParser(): DocumentParser {
  return new CompositeDocumentParser([
    new DocxParser(),
    new PdfParser(),
  ]);
}
```

**Task 5.3: Unit Tests for CompositeParser**
- Routes .docx to DocxParser
- Routes .pdf to PdfParser
- Throws error for unsupported formats

### Phase 6: UI Updates (1 day)

**Task 6.1: Update CreateProjectDialog**
- Modify: `src/components/dashboard/CreateProjectDialog.tsx`

```tsx
<input
  type="file"
  accept=".docx,.pdf"
  ...
/>
```

**Task 6.2: Update UI Tests**
- PDF file can be selected
- PDF file import triggers correct flow

### Phase 7: Integration Tests (2 days)

**Task 7.1: Create Integration Tests**
- File: `src/infrastructure/document/pdf-pipeline.integration.test.ts`
- Tests with real PDF files

**Task 7.2: Add Test Fixtures**
- `tests/fixtures/simple.pdf` - Plain text
- `tests/fixtures/formatted.pdf` - Bold, italic, headings
- `tests/fixtures/multi-chapter.pdf` - With PDF outline
- `tests/fixtures/long-document.pdf` - 10,000+ words (tests word limit split)
- `tests/fixtures/scanned.pdf` - Image-based (for error testing)

### Phase 8: Documentation (1 day)

**Task 8.1: Update CLAUDE.md**
- Add PDF import to feature list

**Task 8.2: Update README.md**
- Document PDF import capability and limitations

**Task 8.3: Update docs/architecture.md**
- Add PdfParser and CompositeParser

---

## 6. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Scanned PDFs cause confusion** | High | Low | Clear error message in French |
| **Font name parsing unreliable** | Medium | Medium | Graceful degradation to plain text |
| **Complex layouts (columns)** | High | Medium | Extract text sequentially, warn user |
| **Large PDFs slow** | Low | Medium | Add progress indicator if needed |
| **Chapter detection fails** | Medium | Low | Word limit fallback ensures usable result |

---

## 7. Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| PDF import (10 pages) | < 3s | Matches DOCX target |
| PDF import (100 pages) | < 10s | Linear scaling acceptable |
| Chapter detection | < 500ms | Included in total |
| Memory usage | < 100MB | For 100-page PDF |

---

## 8. Test Coverage Requirements

| Module | Test Count | Coverage Target |
|--------|------------|-----------------|
| pdf-text-extraction.ts | 8-10 | 100% |
| pdf-formatting.ts | 8-10 | 100% |
| pdf-chapter-detection.ts | 10-12 | 100% |
| PdfParser.ts | 12-15 | 100% |
| CompositeParser.ts | 6-8 | 100% |

---

## 9. Out of Scope (Future Enhancements)

- OCR for scanned PDFs (requires Tesseract/cloud API)
- Table extraction
- Image extraction
- PDF annotations import
- Streaming for very large PDFs
- Column layout reconstruction

---

## 10. Critical Files Reference

| File | Purpose |
|------|---------|
| `src/domain/interfaces/DocumentParser.ts` | Interface that PdfParser must implement |
| `src/infrastructure/document/parsers/DocxParser.ts` | Reference implementation |
| `src/infrastructure/document/utils/tiptap-conversion.ts` | TipTap JSON utilities |
| `src/infrastructure/config/providers.ts` | Dependency injection |
| `src/components/dashboard/CreateProjectDialog.tsx` | UI entry point |
