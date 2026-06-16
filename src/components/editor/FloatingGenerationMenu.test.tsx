// ABOUTME: Tests for FloatingGenerationMenu visibility
// ABOUTME: Verifies long-form generation is hidden from the primary editor UI

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { FloatingGenerationMenu } from './FloatingGenerationMenu';

describe('FloatingGenerationMenu', () => {
  it('does not render by default because long-form generation is deprecated from the primary UI', () => {
    const { container } = render(
      <FloatingGenerationMenu
        editor={{} as Editor}
        projectId="project-1"
        isVisible={true}
        showAIFeatures={true}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
