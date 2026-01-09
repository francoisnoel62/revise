// ABOUTME: Auth.js API route handler for Next.js App Router.
// ABOUTME: Handles /api/auth/* endpoints (signin, signout, session, etc.)

import { handlers } from '@/infrastructure/auth/auth-config';

// Force Node.js runtime (required for MongoDB and bcrypt)
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
