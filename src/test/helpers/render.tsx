// ABOUTME: Custom render utilities for React component testing.
// ABOUTME: Provides wrapped renders with common providers and contexts.

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';

/**
 * Custom render options extending RTL options.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial route for routing context (if applicable).
   */
  route?: string;
}

/**
 * Wrapper component that provides common test contexts.
 * Add providers here as the application grows.
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

/**
 * Custom render function that wraps components with necessary providers.
 * Use this instead of RTL's render for consistent test setup.
 *
 * @example
 * ```tsx
 * import { customRender, screen } from '@/test/helpers/render';
 *
 * test('renders component', () => {
 *   customRender(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { route, ...renderOptions } = options || {};

  // Set up route if provided
  if (route) {
    window.history.pushState({}, 'Test page', route);
  }

  return render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  });
}

/**
 * Re-export everything from RTL for convenience.
 */
export * from '@testing-library/react';
export { customRender as render };

/**
 * Helper to create a deferred promise for async testing.
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

/**
 * Helper to wait for a specific condition.
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Helper to flush all pending promises and timers.
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Helper to simulate network delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock function that resolves after a delay.
 */
export function createDelayedMock<T>(value: T, delayMs: number) {
  return async (): Promise<T> => {
    await delay(delayMs);
    return value;
  };
}

/**
 * Create a mock function that rejects after a delay.
 */
export function createDelayedErrorMock(error: Error, delayMs: number) {
  return async (): Promise<never> => {
    await delay(delayMs);
    throw error;
  };
}
