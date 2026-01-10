import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerateCard } from '../GenerateCard';
import type { SafeProvider } from '@/app/actions/provider-actions';

describe('GenerateCard', () => {
  const mockProviders: SafeProvider[] = [
    {
      id: 'provider-1',
      name: 'OpenAI GPT-4',
      type: 'openai',
      maskedApiKey: 'sk-...abc123',
      model: 'gpt-4o',
      isValid: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'provider-2',
      name: 'Anthropic Claude',
      type: 'anthropic',
      maskedApiKey: 'sk-...def456',
      model: 'claude-sonnet-4-5-20250929',
      isValid: true,
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ];

  const mockOnGenerate = vi.fn();

  const defaultProps = {
    typeKey: 'narrative-analysis',
    title: 'Analyse Narrative',
    description: 'Point de vue, structure narrative',
    isGenerating: false,
    providers: mockProviders,
    onGenerate: mockOnGenerate,
  };

  beforeEach(() => {
    mockOnGenerate.mockClear();
  });

  it('should render title and description', () => {
    render(<GenerateCard {...defaultProps} />);
    expect(screen.getByText('Analyse Narrative')).toBeInTheDocument();
    expect(screen.getByText('Point de vue, structure narrative')).toBeInTheDocument();
  });

  it('should render provider select dropdown', () => {
    render(<GenerateCard {...defaultProps} />);
    expect(screen.getByLabelText('AI Provider')).toBeInTheDocument();
  });

  it('should call onGenerate with selected provider ID when button clicked', () => {
    render(<GenerateCard {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Générer avec l'IA/i });
    fireEvent.click(button);

    // Should call with first provider ID by default
    expect(mockOnGenerate).toHaveBeenCalledWith('provider-1');
  });

  it('should use defaultProviderId when provided', () => {
    render(<GenerateCard {...defaultProps} defaultProviderId="provider-2" />);

    const button = screen.getByRole('button', { name: /Générer avec l'IA/i });
    fireEvent.click(button);

    // Should call with default provider ID
    expect(mockOnGenerate).toHaveBeenCalledWith('provider-2');
  });

  it('should show loading state when generating', () => {
    render(<GenerateCard {...defaultProps} isGenerating={true} />);

    expect(screen.getByText('Génération en cours...')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Génération en cours/i });
    expect(button).toBeDisabled();
  });

  it('should disable controls when no providers available', () => {
    render(<GenerateCard {...defaultProps} providers={[]} />);

    expect(screen.getByText(/Aucun provider configuré/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Générer avec l'IA/i });
    expect(button).toBeDisabled();
  });

  it('should disable controls when generating', () => {
    render(<GenerateCard {...defaultProps} isGenerating={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
