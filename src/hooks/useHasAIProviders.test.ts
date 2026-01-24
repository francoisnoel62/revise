// ABOUTME: Test suite for useHasAIProviders hook
// ABOUTME: Tests AI provider availability detection logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHasAIProviders } from './useHasAIProviders';

// Mock the provider action
vi.mock('@/app/actions/provider-actions', () => ({
  listProvidersAction: vi.fn(),
}));

import { listProvidersAction } from '@/app/actions/provider-actions';

describe('useHasAIProviders', () => {
  const mockListProvidersAction = listProvidersAction as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return hasAIProviders=false when no providers exist', async () => {
    mockListProvidersAction.mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useHasAIProviders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAIProviders).toBe(false);
    expect(result.current.providers).toEqual([]);
  });

  it('should return hasAIProviders=true when valid providers exist', async () => {
    mockListProvidersAction.mockResolvedValue({
      success: true,
      data: [
        { id: 'provider-1', name: 'OpenAI', isValid: true },
        { id: 'provider-2', name: 'Anthropic', isValid: true },
      ],
    });

    const { result } = renderHook(() => useHasAIProviders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAIProviders).toBe(true);
    expect(result.current.providers).toHaveLength(2);
  });

  it('should return hasAIProviders=false when only invalid providers exist', async () => {
    mockListProvidersAction.mockResolvedValue({
      success: true,
      data: [
        { id: 'provider-1', name: 'Invalid Provider', isValid: false },
      ],
    });

    const { result } = renderHook(() => useHasAIProviders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAIProviders).toBe(false);
  });

  it('should return hasAIProviders=true when at least one valid provider exists', async () => {
    mockListProvidersAction.mockResolvedValue({
      success: true,
      data: [
        { id: 'provider-1', name: 'Invalid Provider', isValid: false },
        { id: 'provider-2', name: 'Valid Provider', isValid: true },
      ],
    });

    const { result } = renderHook(() => useHasAIProviders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAIProviders).toBe(true);
  });

  it('should start with isLoading=true', async () => {
    // Use a promise we can control to prevent immediate resolution
    let resolvePromise: (value: { success: boolean; data: never[] }) => void;
    const pendingPromise = new Promise<{ success: boolean; data: never[] }>((resolve) => {
      resolvePromise = resolve;
    });
    mockListProvidersAction.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useHasAIProviders());

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);

    // Clean up by resolving the promise
    resolvePromise!({ success: true, data: [] });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle API errors gracefully', async () => {
    // Suppress expected console error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockListProvidersAction.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useHasAIProviders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAIProviders).toBe(false);
    expect(result.current.providers).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('should provide refresh function to reload providers', async () => {
    mockListProvidersAction.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useHasAIProviders());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAIProviders).toBe(false);

    // Now mock a new provider being added
    mockListProvidersAction.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'new-provider', name: 'New Provider', isValid: true }],
    });

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.hasAIProviders).toBe(true);
    });
  });
});
