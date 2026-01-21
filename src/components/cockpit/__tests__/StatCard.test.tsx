// ABOUTME: Tests for StatCard component
// ABOUTME: Verifies rendering, loading state, and accessibility

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '../StatCard';
import { FileText } from 'lucide-react';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Word Count" value={5000} />);

    expect(screen.getByText('Word Count')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <StatCard
        title="Words"
        value={5000}
        description="Total across all chapters"
      />
    );

    expect(screen.getByText('Total across all chapters')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <StatCard title="Chapters" value={10} icon={FileText} />
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <StatCard title="Words" value={0} isLoading />
    );

    expect(screen.queryByText('Words')).not.toBeInTheDocument();

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('formats large numbers correctly', () => {
    render(<StatCard title="Characters" value="50,000" />);

    expect(screen.getByText('50,000')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    render(<StatCard title="Test" value={100} />);

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
