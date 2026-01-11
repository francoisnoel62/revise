// ABOUTME: Test suite for DocumentControls component
// ABOUTME: Validates export UI interactions and Server Action calls

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentControls } from './DocumentControls';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock project store
const mockSetIsExporting = vi.fn();
vi.mock('@/store/projectStore', () => ({
  useProjectStore: () => ({
    projectId: 'test-project-id',
    project: { id: 'test-project-id', title: 'Test Project' },
    isExporting: false,
    setIsExporting: mockSetIsExporting,
  }),
}));

// Mock Server Actions
const mockExportProject = vi.fn();
const mockExportProjectPdf = vi.fn();
vi.mock('@/app/actions', () => ({
  exportProject: (...args: unknown[]) => mockExportProject(...args),
  exportProjectPdf: (...args: unknown[]) => mockExportProjectPdf(...args),
}));

describe('DocumentControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render export button', () => {
    render(<DocumentControls />);

    expect(screen.getByText('Exporter')).toBeInTheDocument();
  });

  it('should not render import button', () => {
    render(<DocumentControls />);

    expect(screen.queryByText('Importer')).not.toBeInTheDocument();
  });

  it('should call exportProject when export button is clicked', async () => {
    const user = userEvent.setup();

    // Mock successful export
    mockExportProject.mockResolvedValue({
      success: true,
      data: {
        buffer: new Uint8Array([1, 2, 3]),
        filename: 'test.docx',
      },
    });

    // Mock URL and document methods for download
    const mockCreateObjectURL = vi.fn(() => 'blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(<DocumentControls />);

    // Click dropdown trigger
    const exportButton = screen.getByText('Exporter');
    await user.click(exportButton);

    // Click DOCX option in dropdown
    const docxOption = await screen.findByText('DOCX (Word)');
    await user.click(docxOption);

    expect(mockExportProject).toHaveBeenCalledWith('test-project-id');
  });
});
