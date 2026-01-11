// ABOUTME: Next.js proxy for route protection using Auth.js
// ABOUTME: Redirects unauthenticated users from protected routes to sign-in

import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/editor', '/project'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/signin', '/auth/signup'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  // Check if route requires auth
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some((route) => path === route);

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', nextUrl);
    signInUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Redirect authenticated users from landing page to dashboard
  if (path === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
