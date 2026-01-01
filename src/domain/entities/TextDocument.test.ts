// ABOUTME: Test suite for TextDocument entity ensuring basic construction and text retrieval
// ABOUTME: Validates domain entity behavior in isolation from infrastructure

import { describe, it, expect } from 'vitest';
import { TextDocument } from './TextDocument';

describe('TextDocument', () => {
  it('should create a document with content', () => {
    const content = 'Hello, world!';
    const doc = new TextDocument(content);

    expect(doc.getContent()).toBe(content);
  });

  it('should create an empty document by default', () => {
    const doc = new TextDocument();

    expect(doc.getContent()).toBe('');
  });
});
