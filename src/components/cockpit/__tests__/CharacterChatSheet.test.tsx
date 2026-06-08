// ABOUTME: Tests for CharacterChatSheet component
// ABOUTME: Validates rendering, message display, input state, and close behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterChatSheet } from '../CharacterChatSheet';
import type { SerializedCharacter } from '@/app/actions/character-actions';

vi.mock('@/hooks/useCharacterChat', () => ({
  useCharacterChat: vi.fn(),
}));

import { useCharacterChat } from '@/hooks/useCharacterChat';

const makeCharacter = (overrides: Partial<SerializedCharacter> = {}): SerializedCharacter => ({
  id: 'char-1',
  projectId: 'proj-1',
  name: 'Élise',
  identity: '',
  appearance: '',
  psychology: '',
  voiceAndLanguage: '',
  backstory: '',
  relationships: '',
  narrativeFunction: '',
  openQuestions: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const defaultHookReturn = {
  messages: [],
  isStreaming: false,
  conversationId: null,
  sendMessage: vi.fn(),
  stopStream: vi.fn(),
};

describe('CharacterChatSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCharacterChat).mockReturnValue(defaultHookReturn);

    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders the character name in the header', () => {
    render(
      <CharacterChatSheet
        open={true}
        character={makeCharacter({ name: 'Héloïse' })}
        projectId="proj-1"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Héloïse/)).toBeInTheDocument();
  });

  it('displays initial messages passed to the hook', () => {
    const messages = [
      { role: 'author' as const, content: 'Bonjour !', createdAt: new Date().toISOString() },
      { role: 'character' as const, content: 'Bonsoir à toi.', createdAt: new Date().toISOString() },
    ];
    vi.mocked(useCharacterChat).mockReturnValue({ ...defaultHookReturn, messages });

    render(
      <CharacterChatSheet
        open={true}
        character={makeCharacter()}
        projectId="proj-1"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Bonjour !')).toBeInTheDocument();
    expect(screen.getByText('Bonsoir à toi.')).toBeInTheDocument();
  });

  it('disables the input while streaming', () => {
    vi.mocked(useCharacterChat).mockReturnValue({ ...defaultHookReturn, isStreaming: true });

    render(
      <CharacterChatSheet
        open={true}
        character={makeCharacter()}
        projectId="proj-1"
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/message/i);
    expect(input).toBeDisabled();
  });

  it('shows a Copy button on character messages', () => {
    const messages = [
      { role: 'character' as const, content: 'Je suis Élise.', createdAt: new Date().toISOString() },
    ];
    vi.mocked(useCharacterChat).mockReturnValue({ ...defaultHookReturn, messages });

    render(
      <CharacterChatSheet
        open={true}
        character={makeCharacter()}
        projectId="proj-1"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument();
  });

  it('calls onClose when the sheet close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CharacterChatSheet
        open={true}
        character={makeCharacter()}
        projectId="proj-1"
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
