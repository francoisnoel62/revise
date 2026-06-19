// ABOUTME: Hook that checks canon freshness on editor load and pushes an actionable notification if stale
// ABOUTME: Runs once when project + provider are both known; idempotent (skips if notification already exists)

'use client';

import { useEffect } from 'react';
import { checkCanonFreshnessAction, generateCanonFactsAction } from '@/app/actions/canon-actions';
import { useNotificationStore } from '@/store/notificationStore';

interface UseCanonFreshnessCheckOptions {
  projectId: string | null;
  providerId: string | null;
  providersLoading: boolean;
}

export function useCanonFreshnessCheck({
  projectId,
  providerId,
  providersLoading,
}: UseCanonFreshnessCheckOptions): void {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const hasNotificationOfType = useNotificationStore((s) => s.hasNotificationOfType);

  useEffect(() => {
    if (!projectId || !providerId || providersLoading) return;
    if (hasNotificationOfType('canon-stale')) return;

    checkCanonFreshnessAction(projectId).then((result) => {
      if (!result.success || !result.data.isStale) return;
      addNotification({
        type: 'canon-stale',
        title: 'Faits canon périmés',
        message: 'Le manuscrit a été modifié depuis la dernière extraction.',
        severity: 'warning',
        action: {
          label: 'Régénérer',
          confirmMessage:
            "L'extraction incrémentale sera relancée pour les chapitres modifiés. Les faits de l'auteur sont préservés.",
          onConfirm: () => generateCanonFactsAction(projectId, providerId).then(() => undefined),
        },
      });
    });
    // Run once when provider id is first known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, providerId, providersLoading]);
}
