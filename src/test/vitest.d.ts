// ABOUTME: Type definitions for Vitest test matchers
// ABOUTME: Extends Vitest Assertion with jest-dom matchers for DOM testing

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining<T = any> extends TestingLibraryMatchers<T, void> {}
}
