// ABOUTME: Keeps one editor session visible to the automatic snapshot server clock.
// ABOUTME: The server owns eligibility and locking; this hook only sends low-frequency heartbeats.

'use client';

import { useEffect, useRef, useState } from 'react';
import { automaticSnapshotHeartbeatAction } from '@/app/actions/snapshot-actions';

const HEARTBEAT_MS = 60_000;

export function useAutomaticSnapshots(projectId: string | undefined): string | null {
  const sessionId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const currentSessionId = sessionId.current ??= window.crypto.randomUUID();
    let cancelled = false;
    const heartbeat = async () => {
      const result = await automaticSnapshotHeartbeatAction(
        projectId,
        currentSessionId,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
      if (!cancelled) setError(result.success ? result.data.error ?? null : result.error);
    };
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), HEARTBEAT_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [projectId]);

  return error;
}
