// ABOUTME: Tests for SpellCheckSettingsCard component
// ABOUTME: Verifies the project vocabulary, its declarations, and the ignored words list

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpellCheckSettingsCard } from '../SpellCheckSettingsCard';

vi.mock('@/app/actions/spell-check-actions', () => ({
  removeWordFromCustomDictionaryAction: vi.fn().mockResolvedValue(undefined),
  addWordToCustomDictionaryAction: vi.fn().mockResolvedValue(undefined),
  removeIgnoredWordAction: vi.fn().mockResolvedValue(undefined),
  clearIgnoredWordsAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/app/actions/personal-dictionary-actions', () => ({
  savePersonalDictionaryAction: vi.fn().mockResolvedValue([]),
}));

import {
  removeWordFromCustomDictionaryAction,
  addWordToCustomDictionaryAction,
  removeIgnoredWordAction,
  clearIgnoredWordsAction,
} from '@/app/actions/spell-check-actions';
import { savePersonalDictionaryAction } from '@/app/actions/personal-dictionary-actions';

describe('SpellCheckSettingsCard', () => {
  const projectId = 'proj-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the custom dictionary section', () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[{ word: 'Arrakis' }, { word: 'Khaleesi' }]}
        initialIgnoredWords={[]}
      />
    );
    expect(screen.getByText('Dictionnaire personnalisé')).toBeInTheDocument();
    expect(screen.getByText('Arrakis')).toBeInTheDocument();
    expect(screen.getByText('Khaleesi')).toBeInTheDocument();
  });

  it('renders the ignored words section', () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[]}
        initialIgnoredWords={['gonna', 'ouais']}
      />
    );
    expect(screen.getByText('Mots ignorés')).toBeInTheDocument();
    expect(screen.getByText('gonna')).toBeInTheDocument();
    expect(screen.getByText('ouais')).toBeInTheDocument();
  });

  it('shows word count badges', () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[{ word: 'Arrakis' }]}
        initialIgnoredWords={['gonna', 'ouais']}
      />
    );
    expect(screen.getByText('1 mot')).toBeInTheDocument();
    expect(screen.getByText('2 mots')).toBeInTheDocument();
  });

  it('removes a word from the custom dictionary on delete click', async () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[{ word: 'Arrakis' }, { word: 'Khaleesi' }]}
        initialIgnoredWords={[]}
      />
    );
    const deleteButtons = screen.getAllByRole('button', { name: /supprimer Arrakis/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(removeWordFromCustomDictionaryAction).toHaveBeenCalledWith(projectId, 'Arrakis');
    });
    expect(screen.queryByText('Arrakis')).not.toBeInTheDocument();
  });

  it('removes a word from the ignored list on delete click', async () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[]}
        initialIgnoredWords={['gonna']}
      />
    );
    const deleteButton = screen.getByRole('button', { name: /supprimer gonna/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(removeIgnoredWordAction).toHaveBeenCalledWith(projectId, 'gonna');
    });
    expect(screen.queryByText('gonna')).not.toBeInTheDocument();
  });

  it('clears all ignored words on "Vider" click', async () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[]}
        initialIgnoredWords={['gonna', 'ouais']}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /vider la liste/i }));

    await waitFor(() => {
      expect(clearIgnoredWordsAction).toHaveBeenCalledWith(projectId);
    });
    expect(screen.queryByText('gonna')).not.toBeInTheDocument();
    expect(screen.queryByText('ouais')).not.toBeInTheDocument();
  });

  it('adds a word manually via the input', async () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[]}
        initialIgnoredWords={[]}
      />
    );
    const input = screen.getByPlaceholderText(/ajouter un mot/i);
    fireEvent.change(input, { target: { value: 'Dûnesombres' } });
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    await waitFor(() => {
      expect(addWordToCustomDictionaryAction).toHaveBeenCalledWith(projectId, 'Dûnesombres');
    });
    expect(screen.getByText('Dûnesombres')).toBeInTheDocument();
  });

  it('shows empty state message when both lists are empty', () => {
    render(
      <SpellCheckSettingsCard
        projectId={projectId}
        initialCustomDictionary={[]}
        initialIgnoredWords={[]}
      />
    );
    expect(screen.getByText(/aucun terme/i)).toBeInTheDocument();
    expect(screen.getByText(/aucun mot ignoré/i)).toBeInTheDocument();
  });

  describe('declaring a word', () => {
    it('offers a nature, a gender and a plural for each word', () => {
      render(
        <SpellCheckSettingsCard
          projectId={projectId}
          initialCustomDictionary={[{ word: 'Vhardun' }]}
          initialIgnoredWords={[]}
        />
      );

      expect(screen.getByLabelText('Nature de Vhardun')).toBeInTheDocument();
      expect(screen.getByLabelText('Genre de Vhardun')).toBeInTheDocument();
      expect(screen.getByLabelText('Pluriel de Vhardun')).toBeInTheDocument();
    });

    it('shows what the author already declared', () => {
      render(
        <SpellCheckSettingsCard
          projectId={projectId}
          initialCustomDictionary={[
            { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
          ]}
          initialIgnoredWords={[]}
        />
      );

      expect(screen.getByLabelText('Nature de krogan')).toHaveValue('noun');
      expect(screen.getByLabelText('Genre de krogan')).toHaveValue('masculine');
      expect(screen.getByLabelText('Pluriel de krogan')).toHaveValue('krogans');
    });

    it('saves the whole vocabulary when a nature is chosen', async () => {
      render(
        <SpellCheckSettingsCard
          projectId={projectId}
          initialCustomDictionary={[{ word: 'Vhardun' }, { word: 'Arrakis' }]}
          initialIgnoredWords={[]}
        />
      );

      fireEvent.change(screen.getByLabelText('Nature de Vhardun'), {
        target: { value: 'proper-noun' },
      });

      await waitFor(() => {
        expect(savePersonalDictionaryAction).toHaveBeenCalledWith(projectId, [
          { word: 'Vhardun', nature: 'proper-noun' },
          { word: 'Arrakis' },
        ]);
      });
    });

    it('saves the gender the author picked', async () => {
      render(
        <SpellCheckSettingsCard
          projectId={projectId}
          initialCustomDictionary={[{ word: 'Vhardun', nature: 'proper-noun' }]}
          initialIgnoredWords={[]}
        />
      );

      fireEvent.change(screen.getByLabelText('Genre de Vhardun'), {
        target: { value: 'feminine' },
      });

      await waitFor(() => {
        expect(savePersonalDictionaryAction).toHaveBeenCalledWith(projectId, [
          { word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' },
        ]);
      });
    });

    it('saves the plural form once the author leaves the field', async () => {
      render(
        <SpellCheckSettingsCard
          projectId={projectId}
          initialCustomDictionary={[{ word: 'krogan', nature: 'noun' }]}
          initialIgnoredWords={[]}
        />
      );

      const plural = screen.getByLabelText('Pluriel de krogan');
      fireEvent.change(plural, { target: { value: 'krogans' } });
      expect(savePersonalDictionaryAction).not.toHaveBeenCalled();

      fireEvent.blur(plural);

      await waitFor(() => {
        expect(savePersonalDictionaryAction).toHaveBeenCalledWith(projectId, [
          { word: 'krogan', nature: 'noun', pluralForm: 'krogans' },
        ]);
      });
    });
  });
});
