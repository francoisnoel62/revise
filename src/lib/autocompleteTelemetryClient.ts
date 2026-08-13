// ABOUTME: Fire-and-forget sender for autocomplete telemetry payloads
// ABOUTME: Uses sendBeacon (fallback fetch keepalive); never blocks typing, swallows errors

import type {
  LifecyclePayload,
  DeletionPayload,
} from '@/application/services/AutocompleteTelemetry';

const ENDPOINT = '/api/completion/telemetry';

export function sendAutocompleteEvent(
  payload: LifecyclePayload | DeletionPayload
): void {
  try {
    const body = JSON.stringify(payload);

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon(ENDPOINT, blob);
      if (queued) return;
    }

    if (typeof fetch === 'function') {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Telemetry must never disrupt the editor.
      });
    }
  } catch {
    // Swallow — instrumentation is best-effort.
  }
}
