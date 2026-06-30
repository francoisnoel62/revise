// ABOUTME: Client-side providers wrapper for the application.
// ABOUTME: Provides session context for Auth.js, auto-signout on tab close, and cookie consent.

'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { CookieConsent } from '@/components/ui/cookie-consent';

interface ProvidersProps {
  children: React.ReactNode;
}

function AutoSignOut() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only set up listener if user is authenticated
    if (!session) return;

    const handlePageHide = () => {
      // Use sendBeacon for reliable signout even when page is closing
      // This is more reliable than fetch() which gets cancelled on unload
      const url = '/api/auth/signout';
      const data = new FormData();
      data.append('callbackUrl', '/auth/signin');

      // Auth.js v5 requires a CSRF token on the signout action.
      // The token is stored in the authjs.csrf-token cookie as rawToken|hash;
      // we extract the rawToken and send it back in the form body.
      const csrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('authjs.csrf-token='));
      if (csrfCookie) {
        const [, encoded] = csrfCookie.split('=');
        const [rawToken] = decodeURIComponent(encoded).split('|');
        data.append('csrfToken', rawToken);
      }

      // sendBeacon guarantees the request is sent even as page closes
      navigator.sendBeacon(url, data);
    };

    // pagehide is more reliable than beforeunload for cleanup
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [session]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AutoSignOut />
      {children}
      <CookieConsent variant="default" />
    </SessionProvider>
  );
}
