// ABOUTME: Composes the concrete browser paged-rendering adapters for the editor entry point.
// ABOUTME: Keeps React preview modules dependent on application seams rather than adapter classes.

import type { PagedRenderer } from '@/application/interfaces/PagedRenderer';
import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import { PagedJsRenderer } from '@/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';

export interface EditorPagedRendering {
  readonly renderer: PagedRenderer;
  readonly converter: TipTapToHtmlConverter;
}

export function createEditorPagedRendering(): EditorPagedRendering {
  return {
    renderer: new PagedJsRenderer(),
    converter: new TipTapToBookHtml(),
  };
}
