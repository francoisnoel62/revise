// ABOUTME: Tests for useCanonFreshnessCheck hook
// ABOUTME: Verifies that a canon-stale notification is pushed when the canon is stale

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanonFreshnessCheck } from './useCanonFreshnessCheck';
import { useNotificationStore } from '@/store/notificationStore';

vi.mock('@/app/actions/canon-actions', () => ({
  checkCanonFreshnessAction: vi.fn(),
  generateCanonFactsAction: vi.fn(),
}));

import { checkCanonFreshnessAction } from '@/app/actions/canon-actions';
const mockCheck = checkCanonFreshnessAction as ReturnType<typeof vi.fn>;

describe('useCanonFreshnessCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({ notifications: [] });
  });

  it('pushes a canon-stale notification when the canon is stale', async () => {
    mockCheck.mockResolvedValue({ success: true, data: { isStale: true, currentHash: 'abc' } });

    await act(async () => {
      renderHook(() =>
        useCanonFreshnessCheck({
          projectId: 'proj-1',
          providerId: 'provider-1',
          providersLoading: false,
        })
      );
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('canon-stale');
    expect(notifications[0].severity).toBe('warning');
    expect(notifications[0].action).toBeDefined();
  });

  it('does not push a notification when the canon is fresh', async () => {
    mockCheck.mockResolvedValue({ success: true, data: { isStale: false, currentHash: 'abc' } });

    await act(async () => {
      renderHook(() =>
        useCanonFreshnessCheck({
          projectId: 'proj-1',
          providerId: 'provider-1',
          providersLoading: false,
        })
      );
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(0);
  });

  it('does not run the check while providers are loading', async () => {
    await act(async () => {
      renderHook(() =>
        useCanonFreshnessCheck({
          projectId: 'proj-1',
          providerId: 'provider-1',
          providersLoading: true,
        })
      );
    });

    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('does not run when projectId is null', async () => {
    await act(async () => {
      renderHook(() =>
        useCanonFreshnessCheck({
          projectId: null,
          providerId: 'provider-1',
          providersLoading: false,
        })
      );
    });

    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('does not push a second notification if one already exists', async () => {
    mockCheck.mockResolvedValue({ success: true, data: { isStale: true, currentHash: 'abc' } });
    useNotificationStore.setState({
      notifications: [
        {
          id: 'existing',
          type: 'canon-stale',
          title: 'already there',
          message: '',
          severity: 'warning',
          isRead: false,
          createdAt: new Date(),
        },
      ],
    });

    await act(async () => {
      renderHook(() =>
        useCanonFreshnessCheck({
          projectId: 'proj-1',
          providerId: 'provider-1',
          providersLoading: false,
        })
      );
    });

    expect(mockCheck).not.toHaveBeenCalled();
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });
});
