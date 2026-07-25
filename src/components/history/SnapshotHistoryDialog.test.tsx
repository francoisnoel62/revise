// ABOUTME: Tests for SnapshotHistoryDialog — manual snapshot creation and consultation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnapshotHistoryDialog } from './SnapshotHistoryDialog';

const mockCreateSnapshot = vi.fn();
const mockUseProjectStore = vi.fn();
vi.mock('@/store/projectStore', () => ({
  useProjectStore: (selector: (state: unknown) => unknown) => mockUseProjectStore(selector),
}));

const mockListSnapshotsAction = vi.fn();
vi.mock('@/app/actions/snapshot-actions', () => ({
  listSnapshotsAction: (...args: unknown[]) => mockListSnapshotsAction(...args),
}));

describe('SnapshotHistoryDialog', () => {
  const projectId = 'project-1';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProjectStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ createSnapshot: mockCreateSnapshot })
    );
    mockListSnapshotsAction.mockResolvedValue({
      success: true,
      data: { snapshots: [], hasUnsnapshottedChanges: true },
    });
  });

  it('loads and displays the snapshot history when opened', async () => {
    mockListSnapshotsAction.mockResolvedValue({
      success: true,
      data: {
        snapshots: [
          {
            id: 'snap-2',
            projectId,
            number: 2,
            type: 'manual',
            title: 'Version 2',
            comment: 'Fin de partie 1',
            authorId: 'user-1',
            chapterCount: 3,
            createdAt: '2026-01-02T10:00:00.000Z',
          },
        ],
        hasUnsnapshottedChanges: false,
      },
    });

    render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Version 2')).toBeInTheDocument();
    });
    expect(screen.getByText('Fin de partie 1')).toBeInTheDocument();
    expect(mockListSnapshotsAction).toHaveBeenCalledWith(projectId);
  });

  it('distinguishes the current unsnapshotted state', async () => {
    mockListSnapshotsAction.mockResolvedValue({
      success: true,
      data: { snapshots: [], hasUnsnapshottedChanges: true },
    });

    render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/état courant/i)).toBeInTheDocument();
    });
  });

  it('creates a snapshot with the entered title and comment via the store', async () => {
    const user = userEvent.setup();
    mockCreateSnapshot.mockResolvedValue({
      success: true,
      data: {
        id: 'snap-1',
        projectId,
        number: 1,
        type: 'manual',
        title: 'Ma version',
        comment: 'Un jalon',
        authorId: 'user-1',
        chapterCount: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);

    await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

    const titleInput = screen.getByLabelText(/titre/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Ma version');

    const commentInput = screen.getByLabelText(/commentaire/i);
    await user.type(commentInput, 'Un jalon');

    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(mockCreateSnapshot).toHaveBeenCalledWith('Ma version', 'Un jalon');
    });
    expect(screen.getByText('Ma version')).toBeInTheDocument();
  });

  it('shows a clear error and does not add a snapshot when the store reports failure', async () => {
    const user = userEvent.setup();
    mockCreateSnapshot.mockResolvedValue({
      success: false,
      error: 'La sauvegarde a échoué. Snapshot non créé.',
    });

    render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText(/la sauvegarde a échoué/i)).toBeInTheDocument();
    });
  });

  it('shows a clear error and does not add a snapshot when creation fails server-side', async () => {
    const user = userEvent.setup();
    mockCreateSnapshot.mockResolvedValue({
      success: false,
      error: 'Project not found',
    });

    render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
    await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });
  });
});
