// ABOUTME: Tests for QuickActionButton component
// ABOUTME: Verifies rendering, interactions, and states

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionButton } from '../QuickActionButton';
import { Pencil } from 'lucide-react';

describe('QuickActionButton', () => {
  it('renders with label and icon', () => {
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        description="Test description"
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        badge={5}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        onClick={onClick}
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when loading', () => {
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        onClick={() => {}}
        loading
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders string badge', () => {
    render(
      <QuickActionButton
        icon={Pencil}
        label="Test Action"
        badge="new"
        onClick={() => {}}
      />
    );

    expect(screen.getByText('new')).toBeInTheDocument();
  });
});
