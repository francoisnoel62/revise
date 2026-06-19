// ABOUTME: Integration tests for useSessionEndTrigger → notificationStore bridge
// ABOUTME: Verifies that extraction results reach the global notification center (real store, mocked server action)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEffect } from 'react';
import { useSessionEndTrigger, INACTIVITY_THRESHOLD_MAX_MS } from './useSessionEndTrigger';
import { useNotificationStore } from '@/store/notificationStore';

vi.mock('@/app/actions/canon-actions', () => ({
  generateCanonFactsAction: vi.fn(),
}));

import { generateCanonFactsAction } from '@/app/actions/canon-actions';
const mockGenerateCanonFacts = generateCanonFactsAction as ReturnType<typeof vi.fn>;

/**
 * Renders the same hook+store bridge as page.tsx:
 *   useSessionEndTrigger → useEffect → useNotificationStore.addNotification
 */
function useIntegratedSessionEndTrigger(opts: {
  projectId: string;
  mode: 'manual' | 'session-end';
  providerId: string | null;
}) {
  const { notification, dismissNotification } = useSessionEndTrigger(opts);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!notification) return;
    addNotification({
      type: notification.type === 'success' ? 'canon-done' : 'canon-error',
      title: notification.type === 'success' ? 'Canon mis à jour' : 'Erreur canon',
      message: notification.message,
      severity: notification.type === 'success' ? 'success' : 'error',
    });
    dismissNotification();
  }, [notification, addNotification, dismissNotification]);
}

describe('useSessionEndTrigger ↔ notificationStore integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useNotificationStore.setState({ notifications: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('successful extraction pushes a canon-done notification into the store', async () => {
    mockGenerateCanonFacts.mockResolvedValue({
      success: true,
      data: { factCount: 4, characterCount: 2 },
    });

    renderHook(() =>
      useIntegratedSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MAX_MS + 1000);
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('canon-done');
    expect(notifications[0].severity).toBe('success');
  });

  it('failed extraction pushes a canon-error notification into the store', async () => {
    mockGenerateCanonFacts.mockResolvedValue({
      success: false,
      error: 'LLM unavailable',
    });

    renderHook(() =>
      useIntegratedSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'session-end',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MAX_MS + 1000);
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('canon-error');
    expect(notifications[0].severity).toBe('error');
  });

  it('manual mode never pushes any notification into the store', async () => {
    renderHook(() =>
      useIntegratedSessionEndTrigger({
        projectId: 'proj-1',
        mode: 'manual',
        providerId: 'provider-1',
      })
    );

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(INACTIVITY_THRESHOLD_MAX_MS + 1000);
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(0);
    expect(mockGenerateCanonFacts).not.toHaveBeenCalled();
  });
});
