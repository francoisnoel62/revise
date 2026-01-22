// ABOUTME: Tests for ProgressCard component
// ABOUTME: Verifies progress calculation, rendering, and edge cases

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressCard } from '../ProgressCard';

describe('ProgressCard', () => {
  it('renders title and progress values', () => {
    render(
      <ProgressCard title="Objectif projet" current={5000} target={10000} />
    );

    expect(screen.getByText('Objectif projet')).toBeInTheDocument();
    // French locale uses non-breaking space for thousands separator
    expect(screen.getByText(/5[\s\u00A0]?000.*10[\s\u00A0]?000.*mots/)).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<ProgressCard title="Progress" current={2500} target={10000} />);

    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it('caps percentage at 100%', () => {
    render(<ProgressCard title="Progress" current={15000} target={10000} />);

    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('handles zero target gracefully', () => {
    render(<ProgressCard title="Progress" current={100} target={0} />);

    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it('uses custom unit when provided', () => {
    render(
      <ProgressCard title="Chapitres" current={5} target={20} unit="chapitres" />
    );

    expect(screen.getByText(/chapitres/)).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<ProgressCard title="Progress" current={0} target={100} isLoading />);

    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('renders progress bar', () => {
    const { container } = render(
      <ProgressCard title="Progress" current={5000} target={10000} />
    );

    // Progress component should be present
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });
});
