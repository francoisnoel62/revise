// ABOUTME: Tests the live paged preview driven by a publication profile.
// ABOUTME: Verifies profile-driven geometry, page-number offsets, and page-count callbacks.

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicationPreview } from './PublicationPreview';

const content = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { semanticRole: 'corps' },
      content: [{ type: 'text', text: 'Contenu préservé' }],
    },
  ],
};

describe('PublicationPreview', () => {
  it('regenerates the paged document at the selected profile trim', () => {
    const { rerender } = render(
      <PublicationPreview content={content} profileId="kdp-6x9" overrides={[]} />
    );

    expect(screen.getByTitle('Aperçu paginé KDP 6×9')).toHaveAttribute(
      'srcdoc',
      expect.stringContaining('size: 6in 9in')
    );

    rerender(
      <PublicationPreview content={content} profileId="passerelle" overrides={[]} />
    );

    expect(screen.getByTitle('Aperçu paginé Passerelle')).toHaveAttribute(
      'srcdoc',
      expect.stringContaining('size: 8.27in 11.69in')
    );
  });

  it('includes counter-reset in srcdoc when startPageNumber > 1', () => {
    render(
      <PublicationPreview
        content={content}
        profileId="kdp-6x9"
        overrides={[]}
        startPageNumber={84}
      />
    );
    expect(screen.getByTestId('publication-preview')).toHaveAttribute(
      'srcdoc',
      expect.stringContaining('counter-reset: page 83')
    );
  });

  it('includes a visible page-number rule in srcdoc so the author sees the printed page number', () => {
    render(<PublicationPreview content={content} profileId="kdp-6x9" overrides={[]} />);

    expect(screen.getByTestId('publication-preview')).toHaveAttribute(
      'srcdoc',
      expect.stringContaining('content: counter(page)')
    );
  });

  it('does not add counter-reset when startPageNumber is 1', () => {
    render(
      <PublicationPreview
        content={content}
        profileId="kdp-6x9"
        overrides={[]}
        startPageNumber={1}
      />
    );
    expect(screen.getByTestId('publication-preview')).not.toHaveAttribute(
      'srcdoc',
      expect.stringContaining('counter-reset: page')
    );
  });

  it('wires onPageCountChange to receive counts from the iframe postMessage', () => {
    const onChange = vi.fn();
    const { container } = render(
      <PublicationPreview
        content={content}
        profileId="kdp-6x9"
        overrides={[]}
        onPageCountChange={onChange}
      />
    );

    const iframe = container.querySelector('iframe')!;

    // Simulate postMessage from the preview iframe's contentWindow
    // jsdom sets contentWindow to null for sandboxed iframes, so we patch it
    const fakeWindow = {};
    Object.defineProperty(iframe, 'contentWindow', { value: fakeWindow, writable: true });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'paged-rendered', pageCount: 7, sourceId: null, paginationMs: 150 },
        source: fakeWindow as Window,
      })
    );

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('posts scroll-sync position to the iframe when scrollPosition changes', () => {
    const postMessage = vi.fn();
    const { container, rerender } = render(
      <PublicationPreview
        content={content}
        profileId="kdp-6x9"
        overrides={[]}
        scrollPosition={{ segmentIndex: 0, localRatio: 0 }}
      />
    );

    const iframe = container.querySelector('iframe')!;
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage },
      writable: true,
    });

    rerender(
      <PublicationPreview
        content={content}
        profileId="kdp-6x9"
        overrides={[]}
        scrollPosition={{ segmentIndex: 1, localRatio: 0.5 }}
      />
    );

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'sync-scroll', segmentIndex: 1, localRatio: 0.5 },
      '*'
    );
  });

  it('re-posts the last scroll position after the iframe re-paginates so the preview follows edits', () => {
    const postMessage = vi.fn();
    const { container } = render(
      <PublicationPreview
        content={content}
        profileId="kdp-6x9"
        overrides={[]}
        scrollPosition={{ segmentIndex: 1, localRatio: 0.5 }}
      />
    );

    const iframe = container.querySelector('iframe')!;
    const fakeWindow = { postMessage };
    Object.defineProperty(iframe, 'contentWindow', { value: fakeWindow, writable: true });

    // A content edit re-generates srcDoc; the iframe reloads and re-paginates, resetting
    // its scroll to the top. Receiving 'paged-rendered' must re-apply the editor's
    // current scroll position so the preview follows the text without a manual scroll.
    postMessage.mockClear();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'paged-rendered', pageCount: 3, sourceId: null, paginationMs: 100 },
        source: fakeWindow as unknown as Window,
      })
    );

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'sync-scroll', segmentIndex: 1, localRatio: 0.5 },
      '*'
    );
  });

  it('tags long chapters with data-word-anchor markers every 1000 words', () => {
    const longContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: Array.from({ length: 1200 }, (_, i) => `mot${i}`).join(' ') },
          ],
        },
      ],
    };
    render(<PublicationPreview content={longContent} profileId="kdp-6x9" overrides={[]} />);

    expect(screen.getByTestId('publication-preview')).toHaveAttribute(
      'srcdoc',
      expect.stringContaining('data-word-anchor="1"')
    );
  });
});
