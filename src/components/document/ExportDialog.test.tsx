// ABOUTME: Tests for ExportDialog — format is derived from the active publication profile.
// ABOUTME: No free format choice and no DocxStylePreset selection are offered to the author.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from './ExportDialog';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSetIsExporting = vi.fn();
vi.mock('@/store/projectStore', () => ({
  useProjectStore: () => ({
    projectId: 'test-project-id',
    project: {
      id: 'test-project-id',
      title: 'Test Project',
      chapters: [
        { id: 'ch-1', title: 'Chapitre 1', order: 0, metadata: { wordCount: 10 } },
      ],
    },
    isExporting: false,
    setIsExporting: mockSetIsExporting,
  }),
}));

const mockExportProject = vi.fn();
const mockExportProjectPdf = vi.fn();
vi.mock('@/app/actions', () => ({
  exportProject: (...args: unknown[]) => mockExportProject(...args),
  exportProjectPdf: (...args: unknown[]) => mockExportProjectPdf(...args),
}));

describe('ExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows PDF as the format and offers no format choice when the profile is kdp-6x9', async () => {
    const user = userEvent.setup();
    render(<ExportDialog publicationProfileId="kdp-6x9" />);
    await user.click(screen.getByRole('button', { name: /Exporter/i }));

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.queryByText('DOCX (Word)')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('shows DOCX as the format when the profile is passerelle', async () => {
    const user = userEvent.setup();
    render(<ExportDialog publicationProfileId="passerelle" />);
    await user.click(screen.getByRole('button', { name: /Exporter/i }));

    expect(screen.getByText('DOCX (Word)')).toBeInTheDocument();
  });

  it('calls exportProjectPdf (not exportProject) when the profile is a5', async () => {
    const user = userEvent.setup();
    mockExportProjectPdf.mockResolvedValue({
      success: true,
      data: { buffer: [1, 2, 3], filename: 'Test Project.pdf' },
    });

    render(<ExportDialog publicationProfileId="a5" />);
    await user.click(screen.getByRole('button', { name: /Exporter/i }));
    await user.click(screen.getByRole('button', { name: /Exporter \(PDF\)/i }));

    expect(mockExportProjectPdf).toHaveBeenCalledWith('test-project-id', undefined);
    expect(mockExportProject).not.toHaveBeenCalled();
  });

  it('calls exportProject (not exportProjectPdf) when the profile is passerelle', async () => {
    const user = userEvent.setup();
    mockExportProject.mockResolvedValue({
      success: true,
      data: { buffer: [1, 2, 3], filename: 'Test Project.docx' },
    });

    render(<ExportDialog publicationProfileId="passerelle" />);
    await user.click(screen.getByRole('button', { name: /Exporter/i }));
    await user.click(screen.getByRole('button', { name: /Exporter \(DOCX/i }));

    expect(mockExportProject).toHaveBeenCalledWith('test-project-id', undefined);
    expect(mockExportProjectPdf).not.toHaveBeenCalled();
  });
});
