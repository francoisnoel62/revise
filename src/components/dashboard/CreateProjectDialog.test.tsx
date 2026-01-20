// ABOUTME: Tests for CreateProjectDialog component.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProjectDialog } from './CreateProjectDialog';

describe('CreateProjectDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnCreateProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCreateProject.mockResolvedValue(undefined);
  });

  const renderDialog = (props = {}) => {
    return render(
      <CreateProjectDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateProject={mockOnCreateProject}
        isCreating={false}
        {...props}
      />
    );
  };

  it('renders dialog when open', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nouveau projet')).toBeInTheDocument();
  });

  it('does not render dialog when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has title input field', () => {
    renderDialog();

    expect(screen.getByLabelText(/titre/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mon roman/i)).toBeInTheDocument();
  });

  it('has file upload button', () => {
    renderDialog();

    // Now has two buttons: Fichier and Dossier .md
    expect(screen.getByRole('button', { name: /fichier/i })).toBeInTheDocument();
  });

  it('calls onCreateProject with title when submitted', async () => {
    const user = userEvent.setup();
    renderDialog();

    const titleInput = screen.getByLabelText(/titre/i);
    await user.type(titleInput, 'My Great Novel');

    const submitButton = screen.getByRole('button', { name: /^créer$/i });
    await user.click(submitButton);

    // Now uses ImportData format (null for no file)
    expect(mockOnCreateProject).toHaveBeenCalledWith('My Great Novel', null);
  });

  it('uses default title when empty', async () => {
    const user = userEvent.setup();
    renderDialog();

    const submitButton = screen.getByRole('button', { name: /^créer$/i });
    await user.click(submitButton);

    // Now uses ImportData format (null for no file)
    expect(mockOnCreateProject).toHaveBeenCalledWith('Nouveau projet', null);
  });

  it('shows selected file name', async () => {
    const user = userEvent.setup();
    renderDialog();

    const file = new File(['test content'], 'my-draft.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // First file input (for single files)
    const fileInput = document.querySelector('input[type="file"][accept=".docx,.md"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    expect(screen.getByText('my-draft.docx')).toBeInTheDocument();
  });

  it('allows removing selected file', async () => {
    const user = userEvent.setup();
    renderDialog();

    const file = new File(['test content'], 'my-draft.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // First file input (for single files)
    const fileInput = document.querySelector('input[type="file"][accept=".docx,.md"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    expect(screen.getByText('my-draft.docx')).toBeInTheDocument();

    // Now uses "Supprimer l'import" instead of "Supprimer le fichier"
    const removeButton = screen.getByRole('button', { name: /supprimer l'import/i });
    await user.click(removeButton);

    expect(screen.queryByText('my-draft.docx')).not.toBeInTheDocument();
    // Now shows two buttons: Fichier and Dossier .md
    expect(screen.getByRole('button', { name: /fichier/i })).toBeInTheDocument();
  });

  it('calls onCreateProject with file when submitted', async () => {
    const user = userEvent.setup();
    renderDialog();

    const file = new File(['test content'], 'my-draft.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // First file input (for single files)
    const fileInput = document.querySelector('input[type="file"][accept=".docx,.md"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    const submitButton = screen.getByRole('button', { name: /^créer$/i });
    await user.click(submitButton);

    // Now uses ImportData format: { type: 'file', file: File }
    expect(mockOnCreateProject).toHaveBeenCalledWith('Nouveau projet', { type: 'file', file });
  });

  it('disables inputs when creating', () => {
    renderDialog({ isCreating: true });

    expect(screen.getByLabelText(/titre/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /création/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    renderDialog();

    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange with false when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    // Fill in some data first
    const titleInput = screen.getByLabelText(/titre/i);
    await user.type(titleInput, 'Some Title');

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    // Should call onOpenChange with false
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
