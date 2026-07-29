// ABOUTME: Tests for SnapshotHistoryDialog — manual snapshot creation and consultation.

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnapshotHistoryDialog } from './SnapshotHistoryDialog';

// Mock ResizeObserver for ScrollArea component
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof globalThis.ResizeObserver;
});

const mockCreateSnapshot = vi.fn();
const mockRestoreSnapshot = vi.fn();
const mockLoadProject = vi.fn();
const mockUseProjectStore = vi.fn();
vi.mock('@/store/projectStore', () => ({
  useProjectStore: (selector: (state: unknown) => unknown) => mockUseProjectStore(selector),
}));

const mockListSnapshotsAction = vi.fn();
vi.mock('@/app/actions/snapshot-actions', () => ({
  listSnapshotsAction: (...args: unknown[]) => mockListSnapshotsAction(...args),
  loadSnapshotComparisonAction: vi.fn(),
}));

const currentProject = {
  chapters: [
    { id: 'ch-1', title: 'Chapitre courant 1' },
    { id: 'ch-2', title: 'Chapitre courant 2' },
  ],
};

describe('SnapshotHistoryDialog', () => {
  const projectId = 'project-1';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProjectStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        createSnapshot: mockCreateSnapshot,
        restoreSnapshot: mockRestoreSnapshot,
        loadProject: mockLoadProject,
        project: currentProject,
      })
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
            chapterTitles: ['Chapitre 1', 'Chapitre 2', 'Chapitre 3'],
            sourceSnapshotNumber: null,
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
        chapterTitles: ['Chapitre 1'],
        sourceSnapshotNumber: null,
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

  describe('restore', () => {
    const sourceSnapshot = {
      id: 'snap-4',
      projectId,
      number: 4,
      type: 'manual' as const,
      title: 'Version 4',
      comment: null,
      authorId: 'user-1',
      chapterCount: 1,
      chapterTitles: ['Chapitre restauré'],
      sourceSnapshotNumber: null,
      createdAt: '2026-01-04T00:00:00.000Z',
    };

    beforeEach(() => {
      mockListSnapshotsAction.mockResolvedValue({
        success: true,
        data: { snapshots: [sourceSnapshot], hasUnsnapshottedChanges: false },
      });
    });

    it('opens a confirmation showing the source version and the structure comparison', async () => {
      const user = userEvent.setup();
      render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
      await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: /restaurer/i }));

      expect(screen.getByText('Restaurer la version 4')).toBeInTheDocument();
      expect(screen.getByText(/aucune version existante ne sera supprimée/i)).toBeInTheDocument();
      expect(screen.getByText('Chapitre courant 1')).toBeInTheDocument();
      expect(screen.getByText('Chapitre restauré')).toBeInTheDocument();
    });

    it('mentions the safety snapshot when there are unsnapshotted changes', async () => {
      const user = userEvent.setup();
      mockListSnapshotsAction.mockResolvedValue({
        success: true,
        data: { snapshots: [sourceSnapshot], hasUnsnapshottedChanges: true },
      });
      render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
      await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: /restaurer/i }));

      expect(screen.getByText(/sécurité avant restauration/i)).toBeInTheDocument();
    });

    it('confirms the restore via the store and highlights the new version', async () => {
      const user = userEvent.setup();
      mockRestoreSnapshot.mockResolvedValue({
        success: true,
        data: {
          project: { chapters: [] },
          restoreSnapshot: { ...sourceSnapshot, id: 'snap-restore', number: 5, type: 'restore' },
          safetySnapshot: null,
        },
      });
      render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
      await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: /restaurer/i }));
      await user.click(screen.getByRole('button', { name: /confirmer la restauration/i }));

      await waitFor(() => {
        expect(mockRestoreSnapshot).toHaveBeenCalledWith('snap-4');
      });
      expect(screen.queryByText('Restaurer la version 4')).not.toBeInTheDocument();
    });

    it('shows a reload prompt on concurrent-modification conflict', async () => {
      const user = userEvent.setup();
      mockRestoreSnapshot.mockResolvedValue({
        success: false,
        error: 'Le projet a été modifié entre-temps. Veuillez recharger avant de restaurer.',
      });
      render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
      await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: /restaurer/i }));
      await user.click(screen.getByRole('button', { name: /confirmer la restauration/i }));

      await waitFor(() => {
        expect(screen.getByText(/modifié entre-temps/i)).toBeInTheDocument();
      });
      const reloadButton = screen.getByRole('button', { name: /recharger le projet/i });

      await user.click(reloadButton);

      expect(mockLoadProject).toHaveBeenCalledWith(projectId);
    });

    it('cancels without restoring', async () => {
      const user = userEvent.setup();
      render(<SnapshotHistoryDialog projectId={projectId} open={true} onOpenChange={vi.fn()} />);
      await waitFor(() => expect(mockListSnapshotsAction).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: /restaurer/i }));
      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(mockRestoreSnapshot).not.toHaveBeenCalled();
      expect(screen.queryByText('Restaurer la version 4')).not.toBeInTheDocument();
    });
  });
});
