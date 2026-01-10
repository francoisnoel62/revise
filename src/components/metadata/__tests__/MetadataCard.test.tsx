import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetadataCard } from '../MetadataCard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

  const mockHandlers = {
    onOpen: vi.fn(),
    onDeleted: vi.fn(),
    onRenamed: vi.fn(),
  };

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
});
