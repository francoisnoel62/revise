// ABOUTME: TDD anchor for issue #128 — presentation override layer (passerelle profile).
// ABOUTME: Verifies the round-trip invariant: semantic content is unchanged through apply/strip operations.

import { describe, it, expect } from 'vitest';
import { applyOverrides, stripToSemantic, extractOverrides } from '../PresentationOverrideService';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

function doc(...nodes: ContentNode[]): ContentNode {
  return { type: 'doc', content: nodes };
}

function semanticParagraph(text: string, semanticRole = 'corps'): ContentNode {
  return {
    type: 'paragraph',
    attrs: { semanticRole },
    content: [{ type: 'text', text }],
  };
}

describe('applyOverrides', () => {
  it('applies fontFamily override to a node', () => {
    const input = doc(semanticParagraph('Hello'));
    const result = applyOverrides(input, [{ nodeIndex: 0, props: { fontFamily: 'Times New Roman' } }]);
    expect(result.content![0].attrs?.fontFamily).toBe('Times New Roman');
  });

  it('applies fontSize override to a node', () => {
    const input = doc(semanticParagraph('Hello'));
    const result = applyOverrides(input, [{ nodeIndex: 0, props: { fontSize: '14pt' } }]);
    expect(result.content![0].attrs?.fontSize).toBe('14pt');
  });

  it('applies textAlign override to a node', () => {
    const input = doc(semanticParagraph('Hello'));
    const result = applyOverrides(input, [{ nodeIndex: 0, props: { textAlign: 'center' } }]);
    expect(result.content![0].attrs?.textAlign).toBe('center');
  });

  it('preserves semanticRole when applying override', () => {
    const input = doc(semanticParagraph('Hello', 'corps'));
    const result = applyOverrides(input, [{ nodeIndex: 0, props: { fontSize: '14pt' } }]);
    expect(result.content![0].attrs?.semanticRole).toBe('corps');
  });

  it('applies multiple overrides to different nodes', () => {
    const input = doc(
      semanticParagraph('Node 0'),
      semanticParagraph('Node 1')
    );
    const result = applyOverrides(input, [
      { nodeIndex: 0, props: { fontFamily: 'Georgia' } },
      { nodeIndex: 1, props: { fontSize: '16pt' } },
    ]);
    expect(result.content![0].attrs?.fontFamily).toBe('Georgia');
    expect(result.content![1].attrs?.fontSize).toBe('16pt');
    expect(result.content![0].attrs?.fontSize).toBeUndefined();
    expect(result.content![1].attrs?.fontFamily).toBeUndefined();
  });

  it('returns doc unchanged if overrides is empty', () => {
    const input = doc(semanticParagraph('Hello'));
    const result = applyOverrides(input, []);
    expect(result).toEqual(input);
  });

  it('does not modify nodes not targeted by any override', () => {
    const input = doc(
      semanticParagraph('Node 0'),
      semanticParagraph('Node 1')
    );
    const result = applyOverrides(input, [{ nodeIndex: 0, props: { fontFamily: 'Georgia' } }]);
    expect(result.content![1]).toEqual(input.content![1]);
  });

  it('applies all three presentation props at once', () => {
    const input = doc(semanticParagraph('Hello'));
    const result = applyOverrides(input, [
      { nodeIndex: 0, props: { fontFamily: 'Times New Roman', fontSize: '14pt', textAlign: 'left' } },
    ]);
    expect(result.content![0].attrs?.fontFamily).toBe('Times New Roman');
    expect(result.content![0].attrs?.fontSize).toBe('14pt');
    expect(result.content![0].attrs?.textAlign).toBe('left');
  });

  it('preserves text content in overridden nodes', () => {
    const input = doc(semanticParagraph('Hello world'));
    const result = applyOverrides(input, [{ nodeIndex: 0, props: { fontFamily: 'Georgia' } }]);
    expect(result.content![0].content![0].text).toBe('Hello world');
  });
});

describe('stripToSemantic', () => {
  it('removes fontFamily from node attrs', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontFamily: 'Times New Roman' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].attrs?.fontFamily).toBeUndefined();
  });

  it('removes fontSize from node attrs', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontSize: '14pt' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].attrs?.fontSize).toBeUndefined();
  });

  it('removes textAlign from node attrs', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', textAlign: 'center' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].attrs?.textAlign).toBeUndefined();
  });

  it('preserves semanticRole', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'citation', fontFamily: 'Georgia', fontSize: '12pt' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].attrs?.semanticRole).toBe('citation');
  });

  it('preserves non-presentation attrs (indent)', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', indent: true, fontFamily: 'Georgia', fontSize: '12pt' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].attrs?.semanticRole).toBe('corps');
    expect(result.content![0].attrs?.indent).toBe(true);
    expect(result.content![0].attrs?.fontFamily).toBeUndefined();
    expect(result.content![0].attrs?.fontSize).toBeUndefined();
  });

  it('removes all three presentation props at once', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontFamily: 'Georgia', fontSize: '14pt', textAlign: 'left' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].attrs?.fontFamily).toBeUndefined();
    expect(result.content![0].attrs?.fontSize).toBeUndefined();
    expect(result.content![0].attrs?.textAlign).toBeUndefined();
    expect(result.content![0].attrs?.semanticRole).toBe('corps');
  });

  it('handles nodes with no attrs', () => {
    const input = doc({ type: 'horizontalRule' });
    const result = stripToSemantic(input);
    expect(result.content![0]).toEqual({ type: 'horizontalRule' });
  });

  it('preserves text content through stripping', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontFamily: 'Georgia' },
      content: [{ type: 'text', text: 'Important text' }],
    });
    const result = stripToSemantic(input);
    expect(result.content![0].content![0].text).toBe('Important text');
  });
});

describe('extractOverrides', () => {
  it('extracts the textStyle marks produced by the passerelle toolbar', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', textAlign: 'center' },
      content: [
        {
          type: 'text',
          text: 'Hello',
          marks: [
            {
              type: 'textStyle',
              attrs: { fontFamily: 'Georgia', fontSize: '16pt' },
            },
          ],
        },
      ],
    });

    const overrides = extractOverrides(input);
    const semantic = stripToSemantic(input);

    expect(overrides).toEqual([
      {
        nodeIndex: 0,
        props: { fontFamily: 'Georgia', fontSize: '16pt', textAlign: 'center' },
      },
    ]);
    expect(semantic.content![0].content![0].marks).toBeUndefined();
    expect(semantic.content![0].content![0].text).toBe('Hello');
  });

  it('extracts fontFamily from a node', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontFamily: 'Times New Roman' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = extractOverrides(input);
    expect(result).toHaveLength(1);
    expect(result[0].nodeIndex).toBe(0);
    expect(result[0].props.fontFamily).toBe('Times New Roman');
  });

  it('extracts fontSize from a node', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontSize: '14pt' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = extractOverrides(input);
    expect(result).toHaveLength(1);
    expect(result[0].props.fontSize).toBe('14pt');
  });

  it('extracts textAlign from a node', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', textAlign: 'center' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = extractOverrides(input);
    expect(result).toHaveLength(1);
    expect(result[0].props.textAlign).toBe('center');
  });

  it('returns empty array when no overrides exist', () => {
    const input = doc(semanticParagraph('Hello'));
    const result = extractOverrides(input);
    expect(result).toHaveLength(0);
  });

  it('extracts overrides from multiple nodes, skipping clean ones', () => {
    const input = doc(
      { type: 'paragraph', attrs: { semanticRole: 'corps', fontFamily: 'Georgia' }, content: [{ type: 'text', text: 'A' }] },
      { type: 'paragraph', attrs: { semanticRole: 'corps' }, content: [{ type: 'text', text: 'B' }] },
      { type: 'paragraph', attrs: { semanticRole: 'corps', fontSize: '16pt', textAlign: 'center' }, content: [{ type: 'text', text: 'C' }] },
    );
    const result = extractOverrides(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ nodeIndex: 0, props: { fontFamily: 'Georgia' } });
    expect(result[1]).toEqual({ nodeIndex: 2, props: { fontSize: '16pt', textAlign: 'center' } });
  });

  it('uses correct nodeIndex matching position in doc content', () => {
    const input = doc(
      semanticParagraph('A'),
      semanticParagraph('B'),
      { type: 'paragraph', attrs: { semanticRole: 'corps', fontFamily: 'Georgia' }, content: [{ type: 'text', text: 'C' }] },
    );
    const result = extractOverrides(input);
    expect(result[0].nodeIndex).toBe(2);
  });

  it('does not include semanticRole in extracted props', () => {
    const input = doc({
      type: 'paragraph',
      attrs: { semanticRole: 'corps', fontFamily: 'Georgia' },
      content: [{ type: 'text', text: 'Hello' }],
    });
    const result = extractOverrides(input);
    expect(result[0].props).not.toHaveProperty('semanticRole');
  });
});

describe('round-trip invariant (TDD anchor from issue #128)', () => {
  it('semantic content is invariant through apply → strip cycle', () => {
    const semanticContent = doc(
      { type: 'paragraph', attrs: { semanticRole: 'corps' }, content: [{ type: 'text', text: 'Hello world' }] },
      { type: 'paragraph', attrs: { semanticRole: 'citation' }, content: [{ type: 'text', text: 'A citation' }] },
    );

    const overrides = [
      { nodeIndex: 0, props: { fontFamily: 'Times New Roman', fontSize: '14pt' } },
      { nodeIndex: 1, props: { textAlign: 'center' } },
    ];

    const passerelleContent = applyOverrides(semanticContent, overrides);
    const strippedContent = stripToSemantic(passerelleContent);

    expect(strippedContent).toEqual(semanticContent);
  });

  it('aller-retour complet: apply → strict → passerelle → override restaurée', () => {
    const semanticContent = doc(
      { type: 'paragraph', attrs: { semanticRole: 'corps' }, content: [{ type: 'text', text: 'Hello world' }] }
    );

    const overrideLayer = [
      { nodeIndex: 0, props: { fontFamily: 'Times New Roman', fontSize: '14pt', textAlign: 'left' } },
    ];

    // Step 1: Apply override → passerelle rendering
    const passerelleContent = applyOverrides(semanticContent, overrideLayer);
    expect(passerelleContent.content![0].attrs?.fontFamily).toBe('Times New Roman');
    expect(passerelleContent.content![0].attrs?.semanticRole).toBe('corps');

    // Step 2: Extract overrides from passerelle content (to save before switching profile)
    const savedOverrides = extractOverrides(passerelleContent);
    expect(savedOverrides).toHaveLength(1);
    expect(savedOverrides[0].props.fontFamily).toBe('Times New Roman');

    // Step 3: Strip to semantic (switch to print-ready — no overrides shown)
    const strictContent = stripToSemantic(passerelleContent);
    expect(strictContent.content![0].attrs?.fontFamily).toBeUndefined();
    expect(strictContent.content![0].attrs?.semanticRole).toBe('corps');

    // Step 4: Re-apply saved overrides (switch back to passerelle)
    const restoredContent = applyOverrides(strictContent, savedOverrides);
    expect(restoredContent.content![0].attrs?.fontFamily).toBe('Times New Roman');
    expect(restoredContent.content![0].attrs?.fontSize).toBe('14pt');
    expect(restoredContent.content![0].attrs?.textAlign).toBe('left');
    expect(restoredContent.content![0].attrs?.semanticRole).toBe('corps');
  });

  it('text content is never lost through any operation', () => {
    const semanticContent = doc(
      { type: 'paragraph', attrs: { semanticRole: 'corps' }, content: [{ type: 'text', text: 'Important text' }] }
    );

    const overrides = [{ nodeIndex: 0, props: { fontFamily: 'Georgia', fontSize: '12pt' } }];

    const presented = applyOverrides(semanticContent, overrides);
    const stripped = stripToSemantic(presented);

    expect(stripped.content![0].content![0].text).toBe('Important text');
  });

  it('extract then apply is identity on presented content', () => {
    const presentedContent = doc(
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps', fontFamily: 'Times New Roman', fontSize: '14pt' },
        content: [{ type: 'text', text: 'Hello' }],
      },
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps' },
        content: [{ type: 'text', text: 'World' }],
      },
    );

    const overrides = extractOverrides(presentedContent);
    const stripped = stripToSemantic(presentedContent);
    const restored = applyOverrides(stripped, overrides);

    expect(restored).toEqual(presentedContent);
  });
});
