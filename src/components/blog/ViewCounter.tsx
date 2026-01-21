// ABOUTME: Client component for tracking blog article views
// ABOUTME: Uses cookie + IP hash to prevent duplicate counting within 24h

'use client';

import { useEffect, useRef } from 'react';
import { recordArticleViewAction } from '@/app/actions/blog-actions';

const COOKIE_NAME = 'viewed_articles';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

interface ViewCounterProps {
  articleId: string;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getViewedArticles(): Set<string> {
  const cookie = getCookie(COOKIE_NAME);
  if (!cookie) return new Set();
  return new Set(cookie.split(',').filter(Boolean));
}

function addViewedArticle(articleId: string): void {
  const viewed = getViewedArticles();
  viewed.add(articleId);
  setCookie(COOKIE_NAME, Array.from(viewed).join(','), COOKIE_MAX_AGE);
}

function hasViewedArticle(articleId: string): boolean {
  return getViewedArticles().has(articleId);
}

export function ViewCounter({ articleId }: ViewCounterProps) {
  const hasRecorded = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in strict mode
    if (hasRecorded.current) return;

    // Check cookie first (client-side check)
    if (hasViewedArticle(articleId)) {
      return;
    }

    hasRecorded.current = true;

    // Record the view
    recordArticleViewAction(articleId)
      .then((result) => {
        if (result.success && result.data.recorded) {
          // Add to cookie to prevent future client-side calls
          addViewedArticle(articleId);
        }
      })
      .catch(() => {
        // Silently fail - view tracking is not critical
        hasRecorded.current = false;
      });
  }, [articleId]);

  // This component renders nothing
  return null;
}
