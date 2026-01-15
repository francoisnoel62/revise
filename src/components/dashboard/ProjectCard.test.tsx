// ABOUTME: Tests for ProjectCard component.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './ProjectCard';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock server actions
vi.mock('@/app/actions/project-actions', () => ({
  deleteProjectAction: vi.fn(),
  updateProjectTitleAction: vi.fn(),
}));

import { deleteProjectAction, updateProjectTitleAction } from '@/app/actions/project-actions';

const mockProject = {
  id: 'proj-1',
  title: 'Test Project',
  chapterCount: 5,
  wordCount: 2500,
  updatedAt: new Date().toISOString(),
};

describe('ProjectCard', () => {
  const mockOnOpen = vi.fn();
  const mockOnDeleted = vi.fn();
  const mockOnRenamed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('displays project information', () => {
    render(
      <ProjectCard
        project={mockProject}
        onOpen={mockOnOpen}
        onDeleted={mockOnDeleted}
        onRenamed={mockOnRenamed}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('5 chapitres')).toBeInTheDocument();
    expect(screen.getByText('2.5k mots')).toBeInTheDocument();
  });

  it('calls onOpen when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCard
        project={mockProject}
        onOpen={mockOnOpen}
        onDeleted={mockOnDeleted}
        onRenamed={mockOnRenamed}
      />
    );

    const card = screen.getByText('Test Project').closest('div[class*="cursor-pointer"]');
    await user.click(card!);

    expect(mockOnOpen).toHaveBeenCalledWith('proj-1');
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCard
        project={mockProject}
        onOpen={mockOnOpen}
        onDeleted={mockOnDeleted}
        onRenamed={mockOnRenamed}
      />
    );

    // Open menu
    const menuButton = screen.getByRole('button', { name: '' }); // MoreVertical icon
    await user.click(menuButton);

    // Click delete
    const deleteOption = screen.getByText('Supprimer');
    await user.click(deleteOption);

    // Check dialog appears
    expect(screen.getByText('Supprimer le projet ?')).toBeInTheDocument();
  });

  it('deletes project when confirmed', async () => {
    const user = userEvent.setup();

    vi.mocked(deleteProjectAction).mockResolvedValue({
      success: true,
      data: { deleted: true },
    });

    render(
      <ProjectCard
        project={mockProject}
        onOpen={mockOnOpen}
        onDeleted={mockOnDeleted}
        onRenamed={mockOnRenamed}
      />
    );

    // Open menu and click delete
    await user.click(screen.getByRole('button', { name: '' }));
    await user.click(screen.getByText('Supprimer'));

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: /supprimer/i }));

    await waitFor(() => {
      expect(deleteProjectAction).toHaveBeenCalledWith('proj-1');
      expect(mockOnDeleted).toHaveBeenCalledWith('proj-1');
    });
  });

  it('renames project', async () => {
    const user = userEvent.setup();

    vi.mocked(updateProjectTitleAction).mockResolvedValue({
      success: true,
      data: { ...mockProject, title: 'New Title' },
    });

    render(
      <ProjectCard
        project={mockProject}
        onOpen={mockOnOpen}
        onDeleted={mockOnDeleted}
        onRenamed={mockOnRenamed}
      />
    );

    // Open menu and click rename
    await user.click(screen.getByRole('button', { name: '' }));
    await user.click(screen.getByText('Renommer'));

    // Change title
    const input = screen.getByPlaceholderText('Titre du projet');
    await user.clear(input);
    await user.type(input, 'New Title');

    // Save
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(updateProjectTitleAction).toHaveBeenCalledWith('proj-1', 'New Title');
      expect(mockOnRenamed).toHaveBeenCalledWith('proj-1', 'New Title');
    });
  });
});
