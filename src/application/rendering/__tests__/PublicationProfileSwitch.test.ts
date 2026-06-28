// ABOUTME: TDD anchor for issue #129 publication-profile switching.
// ABOUTME: Verifies semantic-content invariance and dormant override restoration.

import { describe, expect, it } from 'vitest';
import { switchPublicationProfile } from '../PublicationProfileSwitch';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

const semanticContent: ContentNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { semanticRole: 'corps' },
      content: [{ type: 'text', text: 'Un texte intact.' }],
    },
  ],
};

describe('switchPublicationProfile', () => {
  it('preserves semantic content while hiding and restoring passerelle overrides', () => {
    const dormantOverrides = [
      {
        nodeIndex: 0,
        props: { fontFamily: 'Times New Roman', fontSize: '14pt' },
      },
    ];

    const passerelle = switchPublicationProfile(
      semanticContent,
      'passerelle',
      dormantOverrides
    );
    const printReady = switchPublicationProfile(
      passerelle.content,
      'kdp-6x9',
      passerelle.overrides
    );
    const restored = switchPublicationProfile(
      printReady.content,
      'passerelle',
      printReady.overrides
    );

    expect(printReady.content).toEqual(semanticContent);
    expect(restored.content).toEqual(passerelle.content);
    expect(restored.overrides).toEqual(dormantOverrides);
  });
});
