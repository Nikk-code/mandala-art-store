import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '@/components/ui';

describe('Pagination Component', () => {
  it('does not render if totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders previous and next controls with correct disabled states', () => {
    const handlePageChange = vi.fn();
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={4} onPageChange={handlePageChange} />
    );

    const prevBtn = screen.getByRole('button', { name: /Go to previous page/i });
    const nextBtn = screen.getByRole('button', { name: /Go to next page/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(2);

    // On last page
    rerender(<Pagination currentPage={4} totalPages={4} onPageChange={handlePageChange} />);
    expect(screen.getByRole('button', { name: /Go to next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Go to previous page/i })).not.toBeDisabled();
  });

  it('indicates current page with aria-current="page"', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);

    const page2Btn = screen.getByRole('button', { name: 'Go to page 2' });
    expect(page2Btn).toHaveAttribute('aria-current', 'page');

    const page1Btn = screen.getByRole('button', { name: 'Go to page 1' });
    expect(page1Btn).not.toHaveAttribute('aria-current');
  });

  it('renders ellipsis for large page ranges', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />);

    const ellipsisElements = screen.getAllByText('…');
    expect(ellipsisElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
  });
});
