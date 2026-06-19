// ABOUTME: Zustand store for in-memory application notifications
// ABOUTME: Notifications are session-scoped and not persisted

import { create } from 'zustand';

export type NotificationSeverity = 'info' | 'warning' | 'success' | 'error';

export interface NotificationAction {
  label: string;
  /** Shown in the confirmation dialog body; defaults to a generic message if absent. */
  confirmMessage?: string;
  onConfirm: () => Promise<void>;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: Date;
  action?: NotificationAction;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  hasNotificationOfType: (type: string) => boolean;
}

let idCounter = 0;

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${++idCounter}`;
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id, isRead: false, createdAt: new Date() },
      ],
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  hasNotificationOfType: (type) => {
    return get().notifications.some((n) => n.type === type);
  },
}));
