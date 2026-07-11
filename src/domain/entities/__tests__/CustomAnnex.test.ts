// ABOUTME: Tests for the CustomAnnex domain entity (author-inserted book annex).
// ABOUTME: Verifies validation, placement, ordering and content mutations.

import { describe, it, expect } from 'vitest';
import { CustomAnnex } from '../CustomAnnex';

const DOC = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });

function make(overrides: Partial<{ id: string; projectId: string; title: string; content: string; placement: 'front' | 'back'; order: number }> = {}) {
  return new CustomAnnex(
    overrides.id ?? 'annex-1',
    overrides.projectId ?? 'proj-1',
    overrides.title ?? 'Présentation de Revise Studio',
    overrides.content ?? DOC,
    overrides.placement ?? 'back',
    overrides.order ?? 0,
  );
}

describe('CustomAnnex', () => {
  it('constructs with valid fields and exposes them', () => {
    const annex = make();
    expect(annex.getId()).toBe('annex-1');
    expect(annex.getProjectId()).toBe('proj-1');
    expect(annex.getTitle()).toBe('Présentation de Revise Studio');
    expect(annex.getPlacement()).toBe('back');
    expect(annex.getOrder()).toBe(0);
    expect(annex.getContent()).toBe(DOC);
  });

  it('rejects an empty id, projectId or title', () => {
    expect(() => make({ id: '' })).toThrow();
    expect(() => make({ projectId: '  ' })).toThrow();
    expect(() => make({ title: '' })).toThrow();
  });

  it('rejects an invalid placement', () => {
    // @ts-expect-error deliberately invalid placement
    expect(() => make({ placement: 'middle' })).toThrow();
  });

  it('rejects content that is not a TipTap doc', () => {
    expect(() => make({ content: '{"type":"paragraph"}' })).toThrow();
    expect(() => make({ content: 'not json' })).toThrow();
  });

  it('createEmpty produces a valid empty-doc annex', () => {
    const annex = CustomAnnex.createEmpty('annex-2', 'proj-1', 'Annexe', 'front', 3);
    expect(annex.getPlacement()).toBe('front');
    expect(annex.getOrder()).toBe(3);
    expect(annex.getContent()).toContain('"type":"doc"');
  });

  it('updates title, content, placement and order, bumping updatedAt', () => {
    const annex = make();
    const before = annex.getUpdatedAt().getTime();
    annex.updateTitle('Nouveau titre');
    annex.updateContent(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Salut' }] }] }));
    annex.updatePlacement('front');
    annex.setOrder(5);
    expect(annex.getTitle()).toBe('Nouveau titre');
    expect(annex.getPlacement()).toBe('front');
    expect(annex.getOrder()).toBe(5);
    expect(annex.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before);
  });

  it('rejects an empty updated title and invalid updated content', () => {
    const annex = make();
    expect(() => annex.updateTitle('')).toThrow();
    expect(() => annex.updateContent('nope')).toThrow();
  });
});
