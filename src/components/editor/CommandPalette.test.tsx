// ABOUTME: Tests for CommandPalette component
// ABOUTME: Verifies keyboard shortcuts and command execution

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';
import { SafeProvider } from '@/app/actions/provider-actions';

// Mock ResizeObserver for cmdk
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

describe('CommandPalette', () => {
  const mockProviders: SafeProvider[] = [
    { id: 'provider-1', name: 'GPT-4', type: 'openai', isValid: true },
    { id: 'provider-2', name: 'Claude', type: 'anthropic', isValid: true },
  ];

  const defaultProps = {
    open: false,
    onOpenChange: vi.fn(),
    hasSelection: false,
    onRewrite: vi.fn(),
    rewriteLoading: false,
    isChapterEmpty: false,
    onGenerate: vi.fn(),
    generationLoading: false,
    onHistoryClick: vi.fn(),
    autocompleteEnabled: true,
    onAutocompleteChange: vi.fn(),
    providers: mockProviders,
    selectedProviderId: 'provider-1',
    onProviderChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responds to Cmd+Shift+I keyboard shortcut to open', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette {...defaultProps} open={false} onOpenChange={onOpenChange} />);

    // Simulate Cmd+Shift+I
    fireEvent.keyDown(document, {
      key: 'i',
      metaKey: true,
      shiftKey: true,
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('responds to Ctrl+Shift+I keyboard shortcut (Windows)', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette {...defaultProps} open={false} onOpenChange={onOpenChange} />);

    // Simulate Ctrl+Shift+I (Windows)
    fireEvent.keyDown(document, {
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('toggles palette when Cmd+Shift+I is pressed while open', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette {...defaultProps} open={true} onOpenChange={onOpenChange} />);

    // Simulate Cmd+Shift+I
    fireEvent.keyDown(document, {
      key: 'i',
      metaKey: true,
      shiftKey: true,
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not respond to Cmd+I without Shift', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette {...defaultProps} open={false} onOpenChange={onOpenChange} />);

    // Simulate Cmd+I (without Shift)
    fireEvent.keyDown(document, {
      key: 'i',
      metaKey: true,
      shiftKey: false,
    });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not respond to Shift+I without Cmd/Ctrl', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette {...defaultProps} open={false} onOpenChange={onOpenChange} />);

    // Simulate Shift+I (without Cmd/Ctrl)
    fireEvent.keyDown(document, {
      key: 'i',
      metaKey: false,
      ctrlKey: false,
      shiftKey: true,
    });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('cleans up keyboard listener on unmount', () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <CommandPalette {...defaultProps} open={false} onOpenChange={onOpenChange} />
    );

    unmount();

    // After unmount, the keyboard shortcut should not work
    fireEvent.keyDown(document, {
      key: 'i',
      metaKey: true,
      shiftKey: true,
    });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
