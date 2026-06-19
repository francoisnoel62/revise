// ABOUTME: Component tests for NotificationBell
// ABOUTME: Covers badge display, popover listing, and the confirmation → action flow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { NotificationBell } from '../NotificationBell';
import { useNotificationStore } from '@/store/notificationStore';

function resetStore() {
  act(() => {
    useNotificationStore.setState({ notifications: [] });
  });
}

describe('NotificationBell', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the bell button', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('shows no badge when there are no notifications', () => {
    render(<NotificationBell />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows unread badge with count of unread notifications', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-stale',
        title: 'Faits canon périmés',
        message: 'Régénérer ?',
        severity: 'warning',
      });
      useNotificationStore.getState().addNotification({
        type: 'canon-done',
        title: 'Canon mis à jour',
        message: '5 faits.',
        severity: 'success',
      });
    });
    render(<NotificationBell />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens the notification list when bell is clicked', async () => {
    const user = userEvent.setup();
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'x',
        title: 'Mon titre',
        message: 'Mon message',
        severity: 'info',
      });
    });
    render(<NotificationBell />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText('Mon titre')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText('Aucune notification')).toBeInTheDocument();
    });
  });

  it('calls onConfirm and dismisses notification when action is confirmed', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-stale',
        title: 'Faits canon périmés',
        message: 'Le manuscrit a été modifié.',
        severity: 'warning',
        action: {
          label: 'Régénérer',
          confirmMessage: 'L\'extraction sera relancée.',
          onConfirm,
        },
      });
    });

    const user = userEvent.setup();
    render(<NotificationBell />);

    // Open the notification panel
    await user.click(screen.getByRole('button', { name: /notifications/i }));

    // Notification title should be visible
    await waitFor(() => {
      expect(screen.getByText('Faits canon périmés')).toBeInTheDocument();
    });

    // Click the action button inside the notification item
    const actionButtons = await screen.findAllByRole('button', { name: 'Régénérer' });
    await user.click(actionButtons[0]);

    // The AlertDialog confirmation should appear
    await waitFor(() => {
      expect(screen.getByText("L'extraction sera relancée.")).toBeInTheDocument();
    });

    // Confirm the action — find the confirm button in the AlertDialog footer
    const confirmButtons = screen.getAllByRole('button', { name: 'Régénérer' });
    const dialogConfirmButton = confirmButtons[confirmButtons.length - 1];
    await user.click(dialogConfirmButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    // Notification must be dismissed after confirmation
    await waitFor(() => {
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  it('does not call onConfirm when action is cancelled', async () => {
    const onConfirm = vi.fn();
    act(() => {
      useNotificationStore.getState().addNotification({
        type: 'canon-stale',
        title: 'Test',
        message: 'msg',
        severity: 'warning',
        action: { label: 'Agir', onConfirm },
      });
    });

    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    await waitFor(() => screen.getByText('Test'));
    await user.click(screen.getByRole('button', { name: 'Agir' }));
    await waitFor(() => screen.getByRole('button', { name: 'Annuler' }));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onConfirm).not.toHaveBeenCalled();
    // Notification not dismissed
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });
});
