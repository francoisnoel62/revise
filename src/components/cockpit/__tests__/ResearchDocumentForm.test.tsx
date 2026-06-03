// ABOUTME: Tests for the ResearchDocumentForm body field
// ABOUTME: Verifies the body textarea is rendered, submitted, and pre-filled from content

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResearchDocumentForm } from '../ResearchDocumentForm';

describe('ResearchDocumentForm — body field', () => {
  it('submits the body text alongside the other fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ResearchDocumentForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Titre \*/i), { target: { value: 'Mon plan' } });
    fireEvent.change(screen.getByLabelText(/Corps/i), {
      target: { value: 'Scénario détaillé du chapitre' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Créer le document/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Scénario détaillé du chapitre' })
    );
  });

  it('pre-fills the body from initialValues content', () => {
    render(
      <ResearchDocumentForm
        onSubmit={vi.fn()}
        initialValues={{ type: 'note', title: 'X', content: { text: 'corps existant' } }}
      />
    );

    const textarea = screen.getByLabelText(/Corps/i) as unknown as { value: string };
    expect(textarea.value).toBe('corps existant');
  });
});
