// ABOUTME: Tests the controlled publication-profile selector shown in the editor.
// ABOUTME: Verifies all profile choices and change notifications through its public interface.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PublicationProfileSelector } from './PublicationProfileSelector';

describe('PublicationProfileSelector', () => {
  it('lets the author switch from KDP to the passerelle profile', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PublicationProfileSelector
        value="kdp-6x9"
        onChange={onChange}
        isSaving={false}
      />
    );

    await user.selectOptions(screen.getByLabelText('Profil de publication'), 'passerelle');

    expect(onChange).toHaveBeenCalledWith('passerelle');
    expect(screen.getByRole('option', { name: 'KDP 6×9' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Passerelle Word / Google Docs' })
    ).toBeInTheDocument();
  });

  it('lists all KDP trim profiles and A5', () => {
    render(
      <PublicationProfileSelector
        value="kdp-6x9"
        onChange={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByRole('option', { name: 'KDP 6×9' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'KDP 5×8' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'KDP 5,25×8' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'KDP 5,5×8,5' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A5 (148×210 mm)' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Passerelle Word / Google Docs' })
    ).toBeInTheDocument();
  });

  it('fires onChange with the new profile id when an option is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PublicationProfileSelector
        value="kdp-6x9"
        onChange={onChange}
        isSaving={false}
      />
    );

    await user.selectOptions(screen.getByLabelText('Profil de publication'), 'kdp-5x8');
    expect(onChange).toHaveBeenCalledWith('kdp-5x8');
  });
});
