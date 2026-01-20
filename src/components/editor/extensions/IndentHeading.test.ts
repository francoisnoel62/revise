// ABOUTME: Tests for IndentHeading extension
// ABOUTME: Validates heading parsing with indent attribute support

import { describe, it, expect } from 'vitest';
import { IndentHeading } from './IndentHeading';

describe('IndentHeading', () => {
  it('should have the name "heading"', () => {
    const extension = IndentHeading.configure({ levels: [1, 2, 3] });
    expect(extension.name).toBe('heading');
  });

  it('should have indent attribute configuration', () => {
    const extension = IndentHeading.configure({ levels: [1, 2] });
    const schema = extension.config.addAttributes?.();

    expect(schema).toHaveProperty('indent');
    expect(schema).toHaveProperty('level');
  });

  it('should parse indent from data-indent attribute', () => {
    const extension = IndentHeading.configure({ levels: [1, 2, 3] });
    const schema = extension.config.addAttributes?.();

    // Mock element with data-indent
    const element = {
      getAttribute: (attr: string) => {
        if (attr === 'data-indent') return 'true';
        return null;
      },
    };

    const parsed = schema?.indent?.parseHTML?.(element as unknown as HTMLElement);
    expect(parsed).toBe(true);
  });

  it('should parse indent from text-indent style', () => {
    const extension = IndentHeading.configure({ levels: [1, 2, 3] });
    const schema = extension.config.addAttributes?.();

    // Mock element with text-indent style
    const element = {
      getAttribute: (attr: string) => {
        if (attr === 'style') return 'text-indent: 1.27cm;';
        return null;
      },
    };

    const parsed = schema?.indent?.parseHTML?.(element as unknown as HTMLElement);
    expect(parsed).toBe(true);
  });

  it('should not parse indent for zero values', () => {
    const extension = IndentHeading.configure({ levels: [1, 2, 3] });
    const schema = extension.config.addAttributes?.();

    // Mock element with text-indent: 0
    const element = {
      getAttribute: (attr: string) => {
        if (attr === 'style') return 'text-indent: 0;';
        return null;
      },
    };

    const parsed = schema?.indent?.parseHTML?.(element as unknown as HTMLElement);
    expect(parsed).toBeUndefined();
  });

  it('should render indent as data-indent attribute', () => {
    const extension = IndentHeading.configure({ levels: [1, 2, 3] });
    const schema = extension.config.addAttributes?.();

    const rendered = schema?.indent?.renderHTML?.({ indent: true });
    expect(rendered).toEqual({ 'data-indent': 'true' });
  });

  it('should return empty object when no indent', () => {
    const extension = IndentHeading.configure({ levels: [1, 2, 3] });
    const schema = extension.config.addAttributes?.();

    const rendered = schema?.indent?.renderHTML?.({ indent: false });
    expect(rendered).toEqual({});

    const renderedUndefined = schema?.indent?.renderHTML?.({ indent: undefined });
    expect(renderedUndefined).toEqual({});
  });

  it('should support configurable heading levels', () => {
    const extension = IndentHeading.configure({ levels: [1, 2] });
    expect(extension.options.levels).toEqual([1, 2]);
  });

  it('should have default levels 1-6', () => {
    const extension = IndentHeading.configure({});
    expect(extension.options.levels).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
