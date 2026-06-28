// ABOUTME: Tests the live paged preview driven by a publication profile.
// ABOUTME: Verifies that changing the profile regenerates the renderer document.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
