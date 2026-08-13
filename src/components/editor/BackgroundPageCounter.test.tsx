// ABOUTME: Tests for BackgroundPageCounter — verifies hidden iframe rendering and postMessage routing.
// ABOUTME: Ensures the component renders nothing when idle and reports page counts correctly.

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createEditorPagedRendering } from '@/app/editor/paged-rendering';
import { BackgroundPageCounter } from './BackgroundPageCounter';

const CHAPTER_ID = 'ch-background';
const CONTENT = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fond de scène.' }] }],
});

const pagedRendering = createEditorPagedRendering();

describe('BackgroundPageCounter', () => {
  it('uses the supplied application adapters to prepare the hidden iframe', () => {
    const converter = { convert: vi.fn(() => '<p>Compteur converti</p>') };
    const renderer = { render: vi.fn(() => '<!doctype html><html>Compteur injecté</html>') };

    render(
      <BackgroundPageCounter
        chapterId={CHAPTER_ID}
        content={CONTENT}
        profileId="kdp-6x9"
        onPageCount={vi.fn()}
        converter={converter}
        renderer={renderer}
      />
    );

    expect(converter.convert).toHaveBeenCalled();
    expect(renderer.render).toHaveBeenCalledWith(
      expect.objectContaining({ bodyHtml: '<p>Compteur converti</p>', sourceId: CHAPTER_ID })
    );
    expect(screen.getByTestId('background-page-counter')).toHaveAttribute(
      'srcdoc',
      '<!doctype html><html>Compteur injecté</html>'
    );
  });

  it('renders nothing when chapterId is null', () => {
    const { container } = render(
      <BackgroundPageCounter
        chapterId={null}
        content={null}
        renderer={pagedRendering.renderer}
        converter={pagedRendering.converter}
        profileId="kdp-6x9"
        onPageCount={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when content is null', () => {
    const { container } = render(
      <BackgroundPageCounter
        chapterId={CHAPTER_ID}
        content={null}
        renderer={pagedRendering.renderer}
        converter={pagedRendering.converter}
        profileId="kdp-6x9"
        onPageCount={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a hidden off-screen iframe when chapterId and content are provided', () => {
    render(
      <BackgroundPageCounter
        chapterId={CHAPTER_ID}
        content={CONTENT}
        renderer={pagedRendering.renderer}
        converter={pagedRendering.converter}
        profileId="kdp-6x9"
        onPageCount={vi.fn()}
      />
    );
    const iframe = screen.getByTestId('background-page-counter');
    expect(iframe).toBeTruthy();
    expect(iframe).toHaveAttribute('aria-hidden', 'true');
    expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts');
  });

  it('iframe srcDoc includes counter-reset only if startPageNumber is injected', () => {
    render(
      <BackgroundPageCounter
        chapterId={CHAPTER_ID}
        content={CONTENT}
        renderer={pagedRendering.renderer}
        converter={pagedRendering.converter}
        profileId="kdp-6x9"
        onPageCount={vi.fn()}
      />
    );
    const iframe = screen.getByTestId('background-page-counter') as HTMLIFrameElement;
    // Background renders without a startPageNumber, so no counter-reset
    expect(iframe.getAttribute('srcdoc')).not.toContain('counter-reset: page');
  });

  it('calls onPageCount when the iframe reports a paged-rendered message', () => {
    const onPageCount = vi.fn();
    const { container } = render(
      <BackgroundPageCounter
        chapterId={CHAPTER_ID}
        content={CONTENT}
        renderer={pagedRendering.renderer}
        converter={pagedRendering.converter}
        profileId="kdp-6x9"
        onPageCount={onPageCount}
      />
    );

    const iframe = container.querySelector('iframe')!;
    const fakeWindow = {};
    Object.defineProperty(iframe, 'contentWindow', { value: fakeWindow, writable: true });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'paged-rendered', pageCount: 12, sourceId: CHAPTER_ID, paginationMs: 200 },
        source: fakeWindow as Window,
      })
    );

    expect(onPageCount).toHaveBeenCalledWith(CHAPTER_ID, 12);
  });

  it('ignores messages from windows other than its own iframe', () => {
    const onPageCount = vi.fn();
    render(
      <BackgroundPageCounter
        chapterId={CHAPTER_ID}
        content={CONTENT}
        renderer={pagedRendering.renderer}
        converter={pagedRendering.converter}
        profileId="kdp-6x9"
        onPageCount={onPageCount}
      />
    );

    // Message from a different source
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'paged-rendered', pageCount: 12, sourceId: null, paginationMs: 100 },
        source: window, // NOT the iframe's contentWindow
      })
    );

    expect(onPageCount).not.toHaveBeenCalled();
  });
});
