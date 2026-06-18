// ABOUTME: Tests for useSessionEndTrigger hook
// ABOUTME: Verifies inactivity detection and canon extraction background trigger

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionEndTrigger, INACTIVITY_THRESHOLD_MS } from './useSessionEndTrigger';

vi.mock('@/app/actions/canon-actions', () => ({
  generateCanonFactsAction: vi.fn(),
}));

import { generateCanonFactsAction } from '@/app/actions/canon-actions';

const mockGenerateCanonFactsAction = generateCanonFactsAction as ReturnType<typeof vi.fn>;

describe('useSessionEndTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing in manual mode', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({ success: true, data: { factCount: 5, characterCount: 2 } });

    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'manual',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(mockGenerateCanonFactsAction).not.toHaveBeenCalled();
  });

  it('triggers extraction after inactivity threshold following first activity', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({ success: true, data: { factCount: 5, characterCount: 2 } });

    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    // Simulate first keystroke to start the session
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(mockGenerateCanonFactsAction).toHaveBeenCalledWith('proj-1', 'provider-1');
  });

  it('does not trigger before threshold', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({ success: true, data: { factCount: 5, characterCount: 2 } });

    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS - 1000);
    });

    expect(mockGenerateCanonFactsAction).not.toHaveBeenCalled();
  });

  it('does not trigger without any activity even after long wait', async () => {
    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    // Advance past threshold WITHOUT any activity event
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(mockGenerateCanonFactsAction).not.toHaveBeenCalled();
  });

  it('resets timer on user activity', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({ success: true, data: { factCount: 5, characterCount: 2 } });

    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    // First activity starts the session clock
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    // Advance to just before threshold
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS - 1000);
    });

    // Second activity resets the countdown
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
    });

    // Advance past the original threshold but not the reset one
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockGenerateCanonFactsAction).not.toHaveBeenCalled();

    // Now advance past threshold from the reset
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS);
    });

    expect(mockGenerateCanonFactsAction).toHaveBeenCalledOnce();
  });

  it('does not trigger again if already running', async () => {
    let resolveExtraction: (v: unknown) => void;
    const extractionPromise = new Promise((resolve) => {
      resolveExtraction = resolve;
    });
    mockGenerateCanonFactsAction.mockReturnValue(extractionPromise);

    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    // Start the session with first activity, then let it idle past threshold
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(mockGenerateCanonFactsAction).toHaveBeenCalledOnce();

    // Activity + advance again — should NOT re-trigger while first is running
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(mockGenerateCanonFactsAction).toHaveBeenCalledOnce();

    // Resolve extraction
    await act(async () => {
      resolveExtraction!({ success: true, data: { factCount: 0, characterCount: 0 } });
    });
  });

  it('returns success notification after successful extraction', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({
      success: true,
      data: { factCount: 7, characterCount: 3 },
    });

    const { result } = renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    expect(result.current.notification).toBeNull();

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(result.current.notification).not.toBeNull();
    expect(result.current.notification?.type).toBe('success');
  });

  it('returns error notification after failed extraction', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({
      success: false,
      error: 'Rate limit exceeded',
    });

    const { result } = renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(result.current.notification?.type).toBe('error');
  });

  it('clears notification via dismissNotification', async () => {
    mockGenerateCanonFactsAction.mockResolvedValue({
      success: true,
      data: { factCount: 5, characterCount: 2 },
    });

    const { result } = renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(result.current.notification).not.toBeNull();

    act(() => {
      result.current.dismissNotification();
    });

    expect(result.current.notification).toBeNull();
  });

  it('skips trigger if no providerId', async () => {
    renderHook(() =>
      useSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: null,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MS + 1000);
    });

    expect(mockGenerateCanonFactsAction).not.toHaveBeenCalled();
  });
});
