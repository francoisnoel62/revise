import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const WORDS_PER_MINUTE = 200;

/**
 * Calculates estimated reading time from word count.
 * Returns a formatted string in French (e.g., "5 min", "1 h 30 min").
 */
export function formatReadingTime(wordCount: number): string {
  if (wordCount <= 0) return '< 1 min';

  const totalMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}
