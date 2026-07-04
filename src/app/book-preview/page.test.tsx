// ABOUTME: Tests for the whole-book preview page's render-timeout guard.
// ABOUTME: Verifies a stuck/failed Paged.js render surfaces a retry UI instead of spinning forever.

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
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapitre 1',
      content: JSON.stringify({ type: 'doc', content: [] }),
      order: 0,
    },
  ],
  frontMatter: { title: 'Mon Roman' },
  profileId: 'kdp-6x9' as const,
};

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

function postPagedRendered(pageCount = 12, paginationMs = 300) {
  const iframe = document.querySelector('iframe')!;
  const fakeWindow = {};
  Object.defineProperty(iframe, 'contentWindow', { value: fakeWindow, writable: true });
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'paged-rendered', pageCount, sourceId: null, paginationMs },
        source: fakeWindow as Window,
      })
    );
  });
}

describe('BookPreviewPage — render timeout guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(getBookPreviewDataAction).mockResolvedValue({
      success: true,
      data: bookPreviewData,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the spinner while pagination is in progress, before the timeout', async () => {
    render(<BookPreviewPage />);
    await flushMicrotasks();

    expect(screen.getByText(/pagination en cours/i)).toBeInTheDocument();
    expect(screen.queryByTestId('book-preview-error')).not.toBeInTheDocument();
  });

  it('does not show an error when paged-rendered arrives before the timeout', async () => {
    render(<BookPreviewPage />);
    await flushMicrotasks();

    postPagedRendered(12, 300);

    expect(screen.getByText('12 pages · 300 ms')).toBeInTheDocument();

    // Advance well past the timeout budget: since the render already succeeded,
    // no error should ever appear.
    await advanceTimers(60_000);
    expect(screen.queryByTestId('book-preview-error')).not.toBeInTheDocument();
  });

  it('shows a retry option instead of spinning forever when paged-rendered never arrives', async () => {
    render(<BookPreviewPage />);
    await flushMicrotasks();

    await advanceTimers(30_000);

    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
    expect(screen.queryByText(/pagination en cours/i)).not.toBeInTheDocument();
  });

  it('retrying resets to the pagination-in-progress state and restarts the timeout', async () => {
    render(<BookPreviewPage />);
    await flushMicrotasks();

    await advanceTimers(30_000);
    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    });

    expect(screen.queryByTestId('book-preview-error')).not.toBeInTheDocument();
    expect(screen.getByText(/pagination en cours/i)).toBeInTheDocument();

    // Still stuck after retry: the timeout must fire again, proving it actually restarted.
    await advanceTimers(30_000);
    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();
  });

  it('recovers from the error state if paged-rendered arrives after a retry', async () => {
    render(<BookPreviewPage />);
    await flushMicrotasks();

    await advanceTimers(30_000);
    expect(screen.getByTestId('book-preview-error')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    });
    postPagedRendered(8, 250);

    expect(screen.getByText('8 pages · 250 ms')).toBeInTheDocument();
    expect(screen.queryByTestId('book-preview-error')).not.toBeInTheDocument();
  });

  it('clears the pending timeout on unmount without throwing', async () => {
    const { unmount } = render(<BookPreviewPage />);
    await flushMicrotasks();

    unmount();

    await expect(advanceTimers(60_000)).resolves.not.toThrow();
  });
});
