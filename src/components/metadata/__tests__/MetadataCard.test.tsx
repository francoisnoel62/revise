import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetadataCard } from '../MetadataCard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock server actions
vi.mock('@/app/actions/metadata-actions', () => ({
  deleteMetadataAction: vi.fn(() => Promise.resolve({ success: true })),
  updateMetadataTitleAction: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('MetadataCard', () => {
  const mockMetadata = {
    id: 'meta-1',
    typeKey: 'narrative-analysis',
    title: 'Analyse Narrative',
    wordCount: 500,
    isGenerated: true,
    lastEdited: new Date().toISOString(),
  };

  const mockProviders = [
    { id: 'provider-1', name: 'OpenAI GPT-4', type: 'openai' },
    { id: 'provider-2', name: 'Claude Sonnet', type: 'anthropic' },
  ];

  const mockHandlers = {
    onOpen: vi.fn(),
    onDeleted: vi.fn(),
    onRenamed: vi.fn(),
    onRegenerate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render metadata title', () => {
    render(<MetadataCard metadata={mockMetadata} {...mockHandlers} />);
    expect(screen.getByText('Analyse Narrative')).toBeInTheDocument();
  });

  it('should show sparkle icon for generated metadata', () => {
    render(<MetadataCard metadata={mockMetadata} {...mockHandlers} />);
    expect(screen.getByTitle('Généré par IA')).toBeInTheDocument();
  });

  it('should call onOpen when card is clicked', () => {
    render(<MetadataCard metadata={mockMetadata} {...mockHandlers} />);

    const card = screen.getByText('Analyse Narrative').closest('[class*="cursor-pointer"]');
    if (card) fireEvent.click(card);

    expect(mockHandlers.onOpen).toHaveBeenCalledWith('meta-1');
  });

  it('should format word count correctly', () => {
    render(<MetadataCard metadata={mockMetadata} {...mockHandlers} />);
    expect(screen.getByText('500 mots')).toBeInTheDocument();
  });

  it('should format large word count with k suffix', () => {
    render(
      <MetadataCard
        metadata={{ ...mockMetadata, wordCount: 1500 }}
        {...mockHandlers}
      />
    );
    expect(screen.getByText('1.5k mots')).toBeInTheDocument();
  });

  describe('regeneration', () => {
    it('should show regenerate option in menu when providers are available', async () => {
      const user = userEvent.setup();
      render(
        <MetadataCard
          metadata={mockMetadata}
          {...mockHandlers}
          providers={mockProviders}
        />
      );

      // Open the dropdown menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Régénérer')).toBeInTheDocument();
      });
    });

    it('should not show regenerate option when no providers', async () => {
      const user = userEvent.setup();
      render(
        <MetadataCard
          metadata={mockMetadata}
          {...mockHandlers}
          providers={[]}
        />
      );

      // Open the dropdown menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      // Wait for menu to open and check Régénérer is not there
      await waitFor(() => {
        expect(screen.getByText('Renommer')).toBeInTheDocument();
      });
      expect(screen.queryByText('Régénérer')).not.toBeInTheDocument();
    });

    it('should not show regenerate option when onRegenerate not provided', async () => {
      const user = userEvent.setup();
      const handlersWithoutRegenerate = {
        onOpen: vi.fn(),
        onDeleted: vi.fn(),
        onRenamed: vi.fn(),
      };

      render(
        <MetadataCard
          metadata={mockMetadata}
          {...handlersWithoutRegenerate}
          providers={mockProviders}
        />
      );

      // Open the dropdown menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      // Wait for menu to open and check Régénérer is not there
      await waitFor(() => {
        expect(screen.getByText('Renommer')).toBeInTheDocument();
      });
      expect(screen.queryByText('Régénérer')).not.toBeInTheDocument();
    });

    it('should open regenerate dialog when clicking regenerate', async () => {
      const user = userEvent.setup();
      render(
        <MetadataCard
          metadata={mockMetadata}
          {...mockHandlers}
          providers={mockProviders}
        />
      );

      // Open the dropdown menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      // Click regenerate
      await waitFor(async () => {
        const regenerateItem = screen.getByText('Régénérer');
        await user.click(regenerateItem);
      });

      // Check dialog is open
      await waitFor(() => {
        expect(screen.getByText(`Régénérer ${mockMetadata.title}`)).toBeInTheDocument();
        expect(screen.getByText('Provider IA')).toBeInTheDocument();
      });
    });

    it('should call onRegenerate with typeKey and providerId when confirming', async () => {
      const user = userEvent.setup();
      render(
        <MetadataCard
          metadata={mockMetadata}
          {...mockHandlers}
          providers={mockProviders}
          defaultProviderId="provider-1"
        />
      );

      // Open the dropdown menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      // Click regenerate to open dialog
      const regenerateItem = await screen.findByText('Régénérer');
      await user.click(regenerateItem);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find and click confirm button in dialog using fireEvent (avoids pointer capture issues)
      const dialog = screen.getByRole('dialog');
      const buttons = dialog.querySelectorAll('button');
      const confirmButton = Array.from(buttons).find(btn => btn.textContent?.includes('Régénérer'));
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }

      expect(mockHandlers.onRegenerate).toHaveBeenCalledWith('narrative-analysis', 'provider-1');
    });
  });
});
