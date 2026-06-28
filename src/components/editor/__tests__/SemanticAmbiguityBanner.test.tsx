// ABOUTME: Tests for SemanticAmbiguityBanner — shown when migrated chapter has ambiguous nodes.
// ABOUTME: Pure UI tests: renders ambiguities list, calls onDismiss, hides when empty.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SemanticAmbiguityBanner } from '../SemanticAmbiguityBanner';
import type { MigrationAmbiguity } from '@/application/migration/ContentMigrator';

const ambiguities: MigrationAmbiguity[] = [
  { nodeIndex: 2, reason: 'Paragraphe centré (textAlign: center) — rôle ambigu, classifié comme corps. Vérifier si c\'est une épigraphe.' },
  { nodeIndex: 5, reason: 'Titre de niveau 2 — rôle non détectable automatiquement. Reclassifier manuellement (sous-titre, citation, etc.).' },
];

describe('SemanticAmbiguityBanner', () => {
  it('renders nothing when ambiguities list is empty', () => {
    const { container } = render(
      <SemanticAmbiguityBanner ambiguities={[]} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a visible banner when there are ambiguities', () => {
    render(<SemanticAmbiguityBanner ambiguities={ambiguities} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays each ambiguity reason', () => {
    render(<SemanticAmbiguityBanner ambiguities={ambiguities} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Vérifier si c'est une épigraphe/i)).toBeInTheDocument();
    expect(screen.getByText(/Reclassifier manuellement/i)).toBeInTheDocument();
  });

  it('shows the count of ambiguous nodes in the heading', () => {
    render(<SemanticAmbiguityBanner ambiguities={ambiguities} onDismiss={vi.fn()} />);
    expect(screen.getByText(/2 blocs? à reclassifier/i)).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<SemanticAmbiguityBanner ambiguities={ambiguities} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
