// ABOUTME: Tests for dashboard page.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock server actions
vi.mock('@/app/actions/project-actions', () => ({
  listProjectsAction: vi.fn(),
  createProjectAction: vi.fn(),
  deleteProjectAction: vi.fn(),
  updateProjectTitleAction: vi.fn(),
}));

import { listProjectsAction, createProjectAction } from '@/app/actions/project-actions';

const mockProjects = [
  {
    id: 'proj-1',
    title: 'Project 1',
    chapterCount: 3,
    wordCount: 1500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    title: 'Project 2',
    chapterCount: 1,
    wordCount: 500,
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(listProjectsAction).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DashboardPage />);

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('displays projects after loading', async () => {
    vi.mocked(listProjectsAction).mockResolvedValue({
      success: true,
      data: mockProjects,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });

  it('shows empty state when no projects', async () => {
    vi.mocked(listProjectsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
  });

  it('creates new project on button click', async () => {
    const user = userEvent.setup();

    vi.mocked(listProjectsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(createProjectAction).mockResolvedValue({
      success: true,
      data: {
        id: 'new-proj',
        title: 'Nouveau projet',
        chapters: [],
        activeChapterId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', {
      name: /create your first project/i,
    });
    await user.click(createButton);

    expect(createProjectAction).toHaveBeenCalled();
  });
});
