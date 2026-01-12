// ABOUTME: Displays a loading overlay with progress bar and author quotes during AI rewrite.
// ABOUTME: Shows rotating quotes from famous authors while the user waits for proposals.

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

// Collection of famous author quotes about writing
const AUTHOR_QUOTES = [
  { text: "Le premier jet n'est que de l'argile à modeler.", author: "Ernest Hemingway" },
  { text: "Écrire, c'est réécrire.", author: "William Zinsser" },
  { text: "La perfection est atteinte non pas lorsqu'il n'y a plus rien à ajouter, mais lorsqu'il n'y a plus rien à retirer.", author: "Antoine de Saint-Exupéry" },
  { text: "Un écrivain est quelqu'un pour qui écrire est plus difficile que pour les autres.", author: "Thomas Mann" },
  { text: "L'art d'écrire est l'art de découvrir ce que vous croyez.", author: "Gustave Flaubert" },
  { text: "La prose est une architecture, pas une décoration intérieure.", author: "Ernest Hemingway" },
  { text: "Chaque mot est comme une note de musique inutile si elle n'est pas à sa place.", author: "Gustave Flaubert" },
  { text: "Il n'y a pas de règles. Vous pouvez écrire une histoire, si vous le pouvez, de n'importe quelle manière.", author: "Somerset Maugham" },
  { text: "Le style, c'est l'homme même.", author: "Buffon" },
  { text: "Écrire, c'est une façon de parler sans être interrompu.", author: "Jules Renard" },
  { text: "Les mots sont des pistolets chargés.", author: "Jean-Paul Sartre" },
  { text: "La vraie vie est si souvent celle qu'on ne vit pas.", author: "Oscar Wilde" },
  { text: "Tous les grands hommes sont des faiseurs de livres.", author: "Voltaire" },
  { text: "Bien écrire, c'est tout à la fois bien penser, bien sentir et bien rendre.", author: "Buffon" },
  { text: "L'écrivain original n'est pas celui qui n'imite personne, mais celui que personne ne peut imiter.", author: "Chateaubriand" },
];

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
            Génération de 5 propositions stylistiques
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
