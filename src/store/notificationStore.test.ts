// ABOUTME: Tests for the in-memory notification store
// ABOUTME: Covers add, dismiss, markAsRead, markAllAsRead, hasNotificationOfType

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { useNotificationStore } from './notificationStore';

function resetStore() {
  act(() => {
    useNotificationStore.setState({ notifications: [] });
  });
}

describe('notificationStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('starts with no notifications', () => {
    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(0);
  });

  it('addNotification adds a notification with generated id, isRead=false and createdAt', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-stale',
        title: 'Faits canon périmés',
        message: 'Le manuscrit a été modifié.',
        severity: 'warning',
      });
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBeTruthy();
    expect(notifications[0].isRead).toBe(false);
    expect(notifications[0].createdAt).toBeInstanceOf(Date);
    expect(notifications[0].type).toBe('canon-stale');
    expect(notifications[0].title).toBe('Faits canon périmés');
  });

  it('addNotification preserves optional action', () => {
    const onConfirm = async () => {};
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-stale',
        title: 'Faits canon périmés',
        message: 'Le manuscrit a été modifié.',
        severity: 'warning',
        action: { label: 'Régénérer', onConfirm },
      });
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].action?.label).toBe('Régénérer');
    expect(notifications[0].action?.onConfirm).toBe(onConfirm);
  });

  it('addNotification generates unique ids for multiple notifications', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'a',
        title: 'A',
        message: 'msg',
        severity: 'info',
      });
      useNotificationStore.getState().addNotification({
        type: 'b',
        title: 'B',
        message: 'msg',
        severity: 'info',
      });
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].id).not.toBe(notifications[1].id);
  });

  it('dismissNotification removes the notification by id', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-done',
        title: 'Canon mis à jour',
        message: '5 faits extraits.',
        severity: 'success',
      });
    });

    const id = useNotificationStore.getState().notifications[0].id;
    act(() => {
      useNotificationStore.getState().dismissNotification(id);
    });

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it('dismissNotification ignores unknown id', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'x',
        title: 'X',
        message: 'msg',
        severity: 'info',
      });
      useNotificationStore.getState().dismissNotification('unknown-id');
    });

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it('markAsRead marks a single notification as read', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'x',
        title: 'X',
        message: 'msg',
        severity: 'info',
      });
    });

    const id = useNotificationStore.getState().notifications[0].id;
    act(() => {
      useNotificationStore.getState().markAsRead(id);
    });

    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);
  });

  it('markAllAsRead marks all notifications as read', () => {
    act(() => {
      useNotificationStore.getState().addNotification({ type: 'a', title: 'A', message: 'msg', severity: 'info' });
      useNotificationStore.getState().addNotification({ type: 'b', title: 'B', message: 'msg', severity: 'warning' });
    });

    act(() => {
      useNotificationStore.getState().markAllAsRead();
    });

    const { notifications } = useNotificationStore.getState();
    expect(notifications.every((n) => n.isRead)).toBe(true);
  });

  it('hasNotificationOfType returns true when a matching notification exists', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-stale',
        title: 'Faits canon périmés',
        message: 'msg',
        severity: 'warning',
      });
    });

    expect(useNotificationStore.getState().hasNotificationOfType('canon-stale')).toBe(true);
    expect(useNotificationStore.getState().hasNotificationOfType('other-type')).toBe(false);
  });

  it('hasNotificationOfType returns false when store is empty', () => {
    expect(useNotificationStore.getState().hasNotificationOfType('canon-stale')).toBe(false);
  });
});
