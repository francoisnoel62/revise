// ABOUTME: Tests for the whole-book preview page (PDF viewer over the server-generated export).
// ABOUTME: Covers the generation spinner, timeout/retry guard, passerelle, page-count, and #page nav.

import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BookPreviewPage from './page';

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace };

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'project' ? 'proj-1' : null) }),
  useRouter: () => mockRouter,
}));

vi.mock('@/app/actions/book-preview-actions', () => ({
  getBookPreviewDataAction: vi.fn(),
}));

import { getBookPreviewDataAction } from '@/app/actions/book-preview-actions';

const bookPreviewData = {
  projectTitle: 'Mon Roman',
  profileId: 'kdp-6x9' as const,
  isPasserelle: false,
  availableProfiles: ['kdp-6x9', 'a5'] as const,
  chapters: [
    { id: 'ch-1', title: 'Chapitre 1', pageNumber: 5 },
    { id: 'ch-2', title: 'Chapitre 2', pageNumber: 41 },
  ],
  totalPageCount: 120,
  frontMatterPageCount: 4,
};

const PENDING = new Promise(() => {}); // never resolves — simulates an in-flight generation

async function flushMicrotasks() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advanceTimers(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('BookPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a generation spinner while the PDF is being produced', async () => {
    vi.mocked(getBookPreviewDataAction).mockReturnValue(PENDING as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    expect(screen.getByText(/génération en cours/i)).toBeInTheDocument();
    expect(screen.queryByTestId('book-preview-error')).not.toBeInTheDocument();
  });

  it('shows the PDF viewer and page count once generation completes', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({ success: true, data: bookPreviewData } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    const iframe = screen.getByTestId('book-preview-pdf');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toContain('/api/book-preview/pdf?project=proj-1&profile=kdp-6x9');
    expect(screen.getByText('120 pages')).toBeInTheDocument();
    expect(screen.queryByText(/génération en cours/i)).not.toBeInTheDocument();
  });

  it('offers only the kdp-6x9 and a5 profiles in the preview selector', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({ success: true, data: bookPreviewData } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    const selector = screen.getByTestId('preview-profile-selector');
    expect(selector.querySelectorAll('[data-profile]')).toHaveLength(2);
    expect(selector.querySelector('[data-profile="kdp-6x9"]')).not.toBeNull();
    expect(selector.querySelector('[data-profile="a5"]')).not.toBeNull();
  });

  it('jumps to the chapter page via the #page anchor when a chapter is clicked', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({ success: true, data: bookPreviewData } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    expect(screen.getByTestId('book-preview-pdf').getAttribute('src')).toContain('#page=1');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Chapitre 2' }));
    });

    expect(screen.getByTestId('book-preview-pdf').getAttribute('src')).toContain('#page=41');
  });

  it('renders indented sous-titre sub-entries under their chapter when present', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({
      success: true,
      data: {
        ...bookPreviewData,
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapitre 1',
            pageNumber: 5,
            subEntries: [{ anchorId: 'chapter-ch-1-soustitre-0', title: 'Sous-titre A', pageNumber: 6 }],
          },
          { id: 'ch-2', title: 'Chapitre 2', pageNumber: 41 },
        ],
      },
    } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    expect(screen.getByRole('button', { name: 'Sous-titre A' })).toBeInTheDocument();
  });

  it('jumps to the sous-titre page via the #page anchor when a sub-entry is clicked', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({
      success: true,
      data: {
        ...bookPreviewData,
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapitre 1',
            pageNumber: 5,
            subEntries: [{ anchorId: 'chapter-ch-1-soustitre-0', title: 'Sous-titre A', pageNumber: 6 }],
          },
          { id: 'ch-2', title: 'Chapitre 2', pageNumber: 41 },
        ],
      },
    } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Sous-titre A' }));
    });

    expect(screen.getByTestId('book-preview-pdf').getAttribute('src')).toContain('#page=6');
  });

  it('renders no sub-entries when a chapter has none', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({ success: true, data: bookPreviewData } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    expect(screen.queryByRole('button', { name: 'Sous-titre A' })).not.toBeInTheDocument();
  });

  it('hides the PDF preview and explains why for the passerelle profile', async () => {
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({
      success: true,
      data: { ...bookPreviewData, isPasserelle: true, profileId: 'passerelle', chapters: [], totalPageCount: 0 },
    } as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    expect(screen.queryByTestId('book-preview-pdf')).not.toBeInTheDocument();
    expect(screen.getByText(/passerelle/i)).toBeInTheDocument();
  });

  it('shows a retry option instead of spinning forever when generation stalls', async () => {
    vi.mocked(getBookPreviewDataAction).mockReturnValue(PENDING as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    await advanceTimers(150_000);

    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
    expect(screen.queryByText(/génération en cours/i)).not.toBeInTheDocument();
  });

  it('retrying resets to the generating state and restarts the timeout', async () => {
    vi.mocked(getBookPreviewDataAction).mockReturnValue(PENDING as never);
    render(<BookPreviewPage />);
    await flushMicrotasks();

    await advanceTimers(150_000);
    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    });
    await flushMicrotasks();

    expect(screen.queryByTestId('book-preview-error')).not.toBeInTheDocument();
    expect(screen.getByText(/génération en cours/i)).toBeInTheDocument();

    await advanceTimers(150_000);
    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();
  });

  it('clears the pending timeout on unmount without throwing', async () => {
    vi.mocked(getBookPreviewDataAction).mockReturnValue(PENDING as never);
    const { unmount } = render(<BookPreviewPage />);
    await flushMicrotasks();

    unmount();

    await expect(advanceTimers(150_000)).resolves.not.toThrow();
  });
});
