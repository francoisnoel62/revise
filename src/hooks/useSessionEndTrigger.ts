// ABOUTME: Hook that detects writing session end (inactivity) and triggers canon extraction
// ABOUTME: Only active when the project is configured for 'session-end' mode

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CanonExtractionMode } from '@/domain/value-objects/CanonExtractionPreferences';
import { generateCanonFactsAction } from '@/app/actions/canon-actions';

export const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export interface SessionEndNotification {
  type: 'success' | 'error';
  message: string;
}

interface UseSessionEndTriggerOptions {
  projectId: string;
  mode: CanonExtractionMode;
  providerId: string | null;
}

interface UseSessionEndTriggerResult {
  notification: SessionEndNotification | null;
  dismissNotification: () => void;
}

export function useSessionEndTrigger({
  projectId,
  mode,
  providerId,
}: UseSessionEndTriggerOptions): UseSessionEndTriggerResult {
  const [notification, setNotification] = useState<SessionEndNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);

  const dismissNotification = useCallback(() => setNotification(null), []);

  const runExtraction = useCallback(async () => {
    if (isRunningRef.current || !providerId) return;

    isRunningRef.current = true;
    try {
      const result = await generateCanonFactsAction(projectId, providerId);
      if (result.success) {
        const { factCount, characterCount } = result.data;
        setNotification({
          type: 'success',
          message: `Canon mis à jour : ${factCount} fait(s), ${characterCount} personnage(s).`,
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error ?? 'Erreur lors de la mise à jour du canon.',
        });
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Erreur lors de la mise à jour du canon.',
      });
    } finally {
      isRunningRef.current = false;
    }
  }, [projectId, providerId]);

  const resetTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(runExtraction, INACTIVITY_THRESHOLD_MS);
  }, [runExtraction]);

  useEffect(() => {
    if (mode !== 'session-end') return;

    const ACTIVITY_EVENTS = ['keydown', 'mousedown', 'wheel', 'touchstart'] as const;

    const handleActivity = () => resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [mode, resetTimer]);

  return { notification, dismissNotification };
}
