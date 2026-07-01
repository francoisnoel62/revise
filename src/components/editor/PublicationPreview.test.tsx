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
});
