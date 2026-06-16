// ABOUTME: Visual indicator in the left margin showing autocomplete suggestion state
// ABOUTME: Breathes when loading or prefetched; solid when ghost text is shown

'use client';

export type AutocompleteDotState = 'idle' | 'loading' | 'prefetched' | 'shown';

interface AutocompleteDotProps {
  state: AutocompleteDotState;
}

export function AutocompleteDot({ state }: AutocompleteDotProps) {
  if (state === 'idle') return null;
  return (
    <div
      className="autocomplete-dot hidden sm:block"
      data-state={state}
      aria-hidden="true"
    />
  );
}
