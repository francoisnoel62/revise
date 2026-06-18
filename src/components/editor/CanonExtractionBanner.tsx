// ABOUTME: Non-blocking notification banner for background canon extraction result
// ABOUTME: Auto-dismisses after a delay; shown at the bottom of the editor viewport

'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { SessionEndNotification } from '@/hooks/useSessionEndTrigger';

const AUTO_DISMISS_MS = 6000;

interface CanonExtractionBannerProps {
  notification: SessionEndNotification | null;
  onDismiss: () => void;
}

export function CanonExtractionBanner({ notification, onDismiss }: CanonExtractionBannerProps) {
  useEffect(() => {
    if (!notification) return;
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg max-w-sm
        ${isSuccess
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
        }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
      )}
      <p className="text-sm flex-1">{notification.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Fermer"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
