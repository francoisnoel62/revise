// ABOUTME: Tests the read-only snapshot comparison dialog at its server-action seam.
// ABOUTME: Covers frozen-state messaging, changed chapters, text diff, and rich-block preview.

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SnapshotComparisonDialog } from './SnapshotComparisonDialog';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof globalThis.ResizeObserver;
});

const mockLoadSnapshotComparisonAction = vi.fn();
vi.mock('@/app/actions/snapshot-actions', () => ({
  loadSnapshotComparisonAction: (...args: unknown[]) => mockLoadSnapshotComparisonAction(...args),
}));

describe('SnapshotComparisonDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSnapshotComparisonAction.mockResolvedValue({
      success: true,
      data: {
        snapshot: {
          id: 'past', projectId: 'project-1', number: 1, type: 'manual', title: 'Version 1', comment: null,
          authorId: 'author-1', chapterCount: 1, chapterTitles: ['Chapitre passé'], sourceSnapshotNumber: null,
          createdAt: '2026-07-01T10:00:00.000Z', projectTitle: 'Roman passé', editorialMetadata: null,
          chapters: [{ id: 'chapter-1', title: 'Chapitre passé', order: 0, content: JSON.stringify({ type: 'doc', content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Le phare était éteint.' }] }, { type: 'horizontalRule' },
          ] }) }],
        },
        current: {
          projectTitle: 'Roman courant', editorialMetadata: null,
          chapters: [{ id: 'chapter-1', title: 'Chapitre courant', order: 0, content: JSON.stringify({ type: 'doc', content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Le phare brillait.' }] },
          ] }) }],
        },
        comparedAt: '2026-07-29T10:00:00.000Z',
      },
    });
  });

  it('shows an immutable server comparison with textual and rich content changes', async () => {
    render(<SnapshotComparisonDialog projectId="project-1" snapshotId="past" open={true} onOpenChange={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/état courant enregistré côté serveur, figé/i)).toBeInTheDocument());
    expect(mockLoadSnapshotComparisonAction).toHaveBeenCalledWith('project-1', 'past');
    expect(screen.getByText(/modifications locales non enregistrées ne sont pas incluses/i)).toBeInTheDocument();
    expect(screen.getByText('Chapitre passé')).toBeInTheDocument();
    expect(screen.getByText('Modifié')).toBeInTheDocument();
    expect(screen.getByText('était éteint')).toBeInTheDocument();
    expect(screen.getByText('brillait')).toBeInTheDocument();
    expect(screen.getByText(/blocs riches supprimés ou modifiés/i)).toBeInTheDocument();
  });
});
