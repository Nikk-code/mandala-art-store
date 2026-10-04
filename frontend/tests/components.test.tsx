import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  Button,
  IconButton,
  Container,
  Section,
  Badge,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/components/ui';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /Click me/i })).toBeInTheDocument();
    });

    it('handles onClick event', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit</Button>);
      fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button and shows spinner when isLoading is true', () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Save
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders terracotta variant', () => {
      render(<Button variant="terracotta">Terracotta Action</Button>);
      const button = screen.getByRole('button', { name: /Terracotta Action/i });
      expect(button.className).toContain('bg-art-terracotta');
    });
  });

  describe('IconButton', () => {
    it('renders with accessible aria-label and icon', () => {
      render(
        <IconButton aria-label="Close dialog" icon={<span data-testid="test-icon">X</span>} />
      );
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('Container & Section', () => {
    it('renders container with correct max-width class', () => {
      const { container } = render(<Container size="md">Content</Container>);
      expect(container.firstChild).toHaveClass('max-w-5xl');
    });

    it('renders section with background token and spacing', () => {
      const { container } = render(
        <Section background="cream" spacing="lg">
          Section Content
        </Section>
      );
      expect(container.firstChild).toHaveClass('bg-art-cream');
      expect(container.firstChild).toHaveClass('py-16');
    });
  });

  describe('Badge', () => {
    it('renders badge with correct variant styles', () => {
      render(<Badge variant="ochre">Artisan</Badge>);
      const badge = screen.getByText('Artisan');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('text-art-ochre');
    });
  });

  describe('State Feedback Components', () => {
    it('renders LoadingState with polite aria-live announcement', () => {
      render(<LoadingState message="Fetching creations..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Fetching creations...')).toBeInTheDocument();
    });

    it('renders EmptyState with optional action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Artworks Found"
          description="Try broadening your search query."
          actionLabel="Clear Filters"
          onAction={handleAction}
        />
      );
      expect(screen.getByRole('region', { name: 'No Artworks Found' })).toBeInTheDocument();
      expect(screen.getByText('Try broadening your search query.')).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: 'Clear Filters' });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders ErrorState with alert role and retry button', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Failed to Load"
          message="Connection timed out."
          retryLabel="Retry Now"
          onRetry={handleRetry}
        />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to Load')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: 'Retry Now' });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
