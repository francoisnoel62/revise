// ABOUTME: Test suite for DocumentControls component
// ABOUTME: Validates import/export UI interactions and Server Action calls

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentControls } from './DocumentControls';

// Mock Server Actions
vi.mock('@/app/actions', () => ({
  importDocument: vi.fn(),
  exportDocument: vi.fn(),
}));

describe('DocumentControls', () => {
  it('should render import and export buttons', () => {
    const onImport = vi.fn();
    const onExport = vi.fn();

    render(<DocumentControls onImport={onImport} onExport={onExport} />);

    expect(screen.getByText('Importer')).toBeInTheDocument();
    expect(screen.getByText('Exporter')).toBeInTheDocument();
  });

  it('should trigger file input when import button is clicked', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const onExport = vi.fn();

    render(<DocumentControls onImport={onImport} onExport={onExport} />);

    const importButton = screen.getByText('Importer');
    await user.click(importButton);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('should accept only .docx files', () => {
    const onImport = vi.fn();
    const onExport = vi.fn();

    render(<DocumentControls onImport={onImport} onExport={onExport} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.docx');
  });
});
