// ABOUTME: Test suite for RewriteButton component
// ABOUTME: Validates visibility, positioning, and interaction behavior

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RewriteButton } from './RewriteButton';

describe('RewriteButton', () => {
  it('should not render when not visible', () => {
    const onRewrite = vi.fn();

    render(
      <RewriteButton
        visible={false}
        position={{ top: 0, left: 0 }}
        onRewrite={onRewrite}
      />
    );

    expect(screen.queryByText('Réécrire')).not.toBeInTheDocument();
  });

  it('should render when visible', () => {
    const onRewrite = vi.fn();

    render(
      <RewriteButton
        visible={true}
        position={{ top: 100, left: 50 }}
        onRewrite={onRewrite}
      />
    );

    expect(screen.getByText('Réécrire')).toBeInTheDocument();
  });

  it('should call onRewrite when clicked', async () => {
    const user = userEvent.setup();
    const onRewrite = vi.fn();

    render(
      <RewriteButton
        visible={true}
        position={{ top: 0, left: 0 }}
        onRewrite={onRewrite}
      />
    );

    await user.click(screen.getByText('Réécrire'));

    expect(onRewrite).toHaveBeenCalledOnce();
  });

  it('should show loading state', () => {
    const onRewrite = vi.fn();

    render(
      <RewriteButton
        visible={true}
        position={{ top: 0, left: 0 }}
        onRewrite={onRewrite}
        loading={true}
      />
    );

    expect(screen.getByText('Génération...')).toBeInTheDocument();
    expect(screen.getByText('Génération...')).toBeDisabled();
  });

  it('should be positioned correctly', () => {
    const onRewrite = vi.fn();

    render(
      <RewriteButton
        visible={true}
        position={{ top: 100, left: 200 }}
        onRewrite={onRewrite}
      />
    );

    const button = screen.getByText('Réécrire');
    expect(button).toHaveStyle({ top: '100px', left: '200px' });
  });
});
