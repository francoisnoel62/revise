// ABOUTME: Ensures the server PDF renderer carries a valid local Paged.js bundle.
// ABOUTME: Guards against reintroducing a runtime HTTP dependency from Vercel Chromium to the app.
// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { loadPagedJsSource } from './ServerPagedJsRenderer';

describe('loadPagedJsSource', () => {
  it('loads the vendored bundle that defines the PagedPolyfill global', () => {
    expect(loadPagedJsSource()).toContain('PagedPolyfill');
  });
});
