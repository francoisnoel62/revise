// ABOUTME: Notification bell icon with unread badge, popover list, and confirm-before-act flow
// ABOUTME: Reads from notificationStore; shows AlertDialog before running any notification action

'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, TriangleAlert, X, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNotificationStore, AppNotification } from '@/store/notificationStore';

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />,
  warning: <TriangleAlert className="h-4 w-4 text-amber-500 shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
};

export function NotificationBell() {
  const { notifications, dismissNotification, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<AppNotification | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Mark all as read when the panel closes so the badge clears after the author views notifications
    if (!next) markAllAsRead();
  };

  const handleActionClick = (notification: AppNotification) => {
    setPendingAction(notification);
  };

  const handleConfirm = async () => {
    if (!pendingAction?.action) return;
    setIsConfirming(true);
    try {
      await pendingAction.action.onConfirm();
      dismissNotification(pendingAction.id);
    } finally {
      setIsConfirming(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-0 text-xs text-muted-foreground"
                onClick={() => {
                  notifications.forEach((n) => dismissNotification(n.id));
                }}
              >
                Tout effacer
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <BellOff className="h-6 w-6" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5">{SEVERITY_ICON[n.severity]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                    {n.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => handleActionClick(n)}
                      >
                        {n.action.label}
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={() => dismissNotification(n.id)}
                    aria-label="Fermer"
                    className="mt-0.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action?.confirmMessage ??
                'Voulez-vous confirmer cette action ? Elle sera exécutée immédiatement.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? 'En cours…' : (pendingAction?.action?.label ?? 'Confirmer')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
