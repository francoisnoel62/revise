// ABOUTME: Displays a loading overlay with progress bar and author quotes during AI rewrite.
// ABOUTME: Shows rotating quotes from famous authors while the user waits for proposals.

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import AUTHOR_QUOTES from '@/data/author-quotes.json';

interface RewriteLoadingOverlayProps {
  isVisible: boolean;
}

export function RewriteLoadingOverlay({ isVisible }: RewriteLoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Shuffle quotes on mount for variety
  const shuffledQuotes = useMemo(() => {
    return [...AUTHOR_QUOTES].sort(() => Math.random() - 0.5);
  }, []);

  // Animate progress bar
  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    // Start at 0 and animate to ~90% over time (never 100% until actual completion)
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        const remaining = 90 - prev;
        const increment = Math.max(0.5, remaining * 0.08);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Rotate quotes every 3 seconds
  useEffect(() => {
    if (!isVisible) {
      setQuoteIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % shuffledQuotes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible, shuffledQuotes.length]);

  if (!isVisible) return null;

  const currentQuote = shuffledQuotes[quoteIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Réécriture en cours...
          </h3>
          <p className="text-sm text-slate-500">
            Génération de 3 propositions stylistiques
          </p>
        </div>

        <Progress value={progress} className="h-2 mb-6" />

        <div className="min-h-24 flex flex-col items-center justify-center text-center">
          <blockquote className="text-slate-700 italic mb-2 transition-opacity duration-500">
            &ldquo;{currentQuote.text}&rdquo;
          </blockquote>
          <cite className="text-sm text-slate-500 not-italic">
            — {currentQuote.author}
          </cite>
        </div>
      </div>
    </div>
  );
}
